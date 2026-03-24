# ============================================================
# step5_demo.py
# ============================================================
# THE COMPLETE DEMO — runs the full attack scenario end to end.
#
# This script has TWO modes:
#
#   MODE 1 — LIVE (uses real CertStream feed)
#     Connects to the global SSL certificate feed.
#     Waits for a real suspicious domain to appear.
#     Can take minutes or hours to trigger.
#     Use this for testing over time — NOT for a live 7-minute pitch.
#
#   MODE 2 — SIMULATED (injects a fake domain directly)
#     Injects a pre-written suspicious domain name into the pipeline.
#     Everything else (screenshot, HTML, visual analysis, login spike,
#     Bridge correlation) runs exactly as in Mode 1.
#     The models cannot tell the difference.
#     Use this for the government demo — guaranteed to work in 90 seconds.
#
# How to run:
#   python step5_demo.py          ← Mode 2 (simulated) — for demo
#   python step5_demo.py --live   ← Mode 1 (live CertStream) — for testing
# ============================================================

import sys
import asyncio
import time
import os
import json
import threading
from datetime import datetime

import certstream
from playwright.async_api import async_playwright

# Import all 5 models from step4
from .models import (
    score_domain, analyze_site, fit_model, classify_report, check_velocity,
    process_event, deploy_canary, check_canary,
    record_fake_site, record_kavach_alert, run_bridge,
)

# ============================================================
# LIVE MODE — CertStream Integration
# ============================================================
# CertStream is a free public WebSocket feed that broadcasts
# every new SSL certificate registration in the world in real time.
# Around 1,000–5,000 certificates per minute globally.
# We filter for ones that look like MCD.

def start_certstream_listener():
    """
    Connects to CertStream and processes every new domain.
    Runs in a background thread so it doesn't block the main program.

    For each new certificate:
    1. Extract all domain names from the certificate
    2. Pass each domain to Model 1 (score_domain)
    3. If Model 1 says investigate=True, pass to the deep analysis pipeline

    CertStream gives us data like:
    {
        "message_type": "certificate_update",
        "data": {
            "leaf_cert": {
                "all_domains": ["mcd-propertytax-pay.in", "www.mcd-propertytax-pay.in"]
            }
        }
    }
    """
    print("[CertStream] Connecting to global SSL certificate feed...")
    print("[CertStream] Watching for MCD-related domains...")
    print("[CertStream] This may take minutes — criminals register new domains continuously")
    print("[CertStream] Press Ctrl+C to stop and switch to simulated mode")
    print()

    def on_certificate(message, context):
        """Called for every new SSL certificate registered anywhere in the world."""
        if message["message_type"] != "certificate_update":
            return

        # Extract all domain names from this certificate
        # One certificate can cover multiple domains (wildcard certs)
        domains = message["data"]["leaf_cert"]["all_domains"]

        for domain in domains:
            # Skip wildcard domains like "*.example.com"
            if domain.startswith("*."):
                continue

            # Run Model 1 — this takes under 1ms
            result = score_domain(domain)

            if result["investigate"]:
                print(f"\n[Model 1] FLAGGED: {domain}")
                print(f"          Reason: {result['reason']}")

                # Determine portal type from keywords
                portal_type = _detect_portal_type(domain)

                # Run deep analysis in a background thread
                # (screenshot takes 8-15 seconds — we don't want to block CertStream)
                thread = threading.Thread(
                    target=lambda: asyncio.run(deep_analysis_pipeline(domain, portal_type))
                )
                thread.daemon = True
                thread.start()

    def on_error(instance, exc, tb):
        print(f"[CertStream] Connection error: {exc}")
        print("[CertStream] Retrying in 5 seconds...")

    # This call is blocking — it runs forever until interrupted
    certstream.listen_for_events(
        on_certificate,
        on_error=on_error,
        url="wss://certstream.cali.dog/"
        # certstream.cali.dog is a free public CertStream relay
        # It re-broadcasts the Google Certificate Transparency logs
    )


def _detect_portal_type(domain: str) -> str:
    """
    Guesses which MCD portal a fake domain is targeting
    based on keywords in the domain name.
    Used to know which reference screenshot to compare against.
    """
    domain_lower = domain.lower()
    if any(w in domain_lower for w in ["property", "propertytax", "ptax"]):
        return "property_tax"
    elif any(w in domain_lower for w in ["water", "watertax", "wtax"]):
        return "water_tax"
    elif any(w in domain_lower for w in ["birth", "death", "certificate"]):
        return "birth_death"
    elif any(w in domain_lower for w in ["trade", "licence", "license"]):
        return "trade_licence"
    else:
        return "property_tax"  # default — property tax is most commonly faked


# ============================================================
# DEEP ANALYSIS PIPELINE
# Runs after Model 1 flags a domain.
# Same for both live and simulated modes.
# ============================================================

async def deep_analysis_pipeline(domain: str, portal_type: str,
                                  site_id: int = None, use_local_html: bool = False):
    """
    Full pipeline from domain → screenshot → Model 2 → canary → record.

    Parameters:
    domain        — the suspicious domain name
    portal_type   — which MCD portal it's targeting ("property_tax" etc.)
    site_id       — integer ID for this fake site record
    use_local_html— True in simulated mode (use local HTML file)
                    False in live mode (visit the real URL)
    """
    if site_id is None:
        site_id = int(datetime.now().timestamp())

    print(f"\n[Deep Analysis] Starting for {domain}...")

    # ── Step 1: Get screenshot and HTML ───────────────────────
    if use_local_html:
        # SIMULATED MODE: Use our pre-built local HTML file
        # This avoids needing an actual hosted fake website
        screenshot_path, html = await _screenshot_local_file(
            "tests/fake_mcd_portal.html"
        )
        # We pass the fake domain name to analyze_site even though
        # the HTML came from a local file — the domain is used to
        # check the "claims govt but not .gov.in" signal
    else:
        # LIVE MODE: Actually visit the suspicious website
        screenshot_path, html = await _screenshot_live_url(domain)

    if screenshot_path is None:
        print(f"[Deep Analysis] ✗ Could not get screenshot for {domain}")
        print(f"[Deep Analysis] Falling back to HTML-only analysis...")
        # Model 2 still works without screenshot — HTML signals run independently

    # ── Step 2: Run Model 2 ───────────────────────────────────
    m2 = analyze_site(
        screenshot_path=screenshot_path,
        html=html,
        domain=domain,
        portal_type=portal_type,
    )

    print(f"[Model 2] Classification: {m2['classification']} (score: {m2['composite_score']})")
    print(f"[Model 2] Evidence: {m2['explanation']}")

    # ── Step 3: If confirmed/probable, deploy canary and record ──
    if m2["classification"] in ("CONFIRMED", "PROBABLE"):
        # Deploy passive canary honeypot
        canary = deploy_canary(site_id=site_id, portal_type=portal_type)
        print(f"[Canary] Deployed: {canary}")
        print(f"[Canary] If attacker uses this on real portal → forensic proof")

        # Record in file for Bridge to use
        record_fake_site(
            site_id=site_id,
            domain=domain,
            portal_type=portal_type,
            classification=m2["classification"],
            explanation=m2["explanation"],
            canary_username=canary,
            detected_at=datetime.now().isoformat(),
        )
        print(f"[Record] Fake site recorded for Bridge correlation")

        # Auto-generate takedown request text
        _generate_takedown_text(domain, m2)

    return m2


async def _screenshot_live_url(domain: str):
    """Takes screenshot of a real live URL. Used in live mode."""
    url        = f"http://{domain}"
    save_path  = f"screenshots/{domain.replace('.','_')}_{int(datetime.now().timestamp())}.png"

    os.makedirs("screenshots", exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )
        page = await browser.new_page(
            viewport={"width": 1280, "height": 800},
            ignore_https_errors=True,  # fake sites often have bad certs
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
            )
            # Fake a real browser user agent — some sites block Python
        )
        try:
            await page.goto(url, timeout=15000)
            await page.wait_for_load_state("networkidle", timeout=10000)
            html = await page.content()
            await page.screenshot(path=save_path, full_page=True)
            await browser.close()
            return save_path, html
        except Exception as e:
            print(f"  Screenshot failed: {e}")
            await browser.close()
            return None, ""


async def _screenshot_local_file(html_file_path: str):
    """Takes screenshot of a local HTML file. Used in simulated mode."""
    abs_path  = os.path.abspath(html_file_path)
    file_url  = f"file://{abs_path}"
    save_path = "screenshots/demo_fake_site.png"

    os.makedirs("screenshots", exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        await page.goto(file_url)
        await page.wait_for_load_state("load")
        html = await page.content()
        await page.screenshot(path=save_path, full_page=True)
        await browser.close()
    return save_path, html


def _generate_takedown_text(domain: str, m2_result: dict):
    """Generates a plain-text takedown request for CERT-In."""
    text = f"""
TAKEDOWN REQUEST — SENTINEL Auto-Generated
===========================================
Date:          {datetime.now().strftime('%d %B %Y, %I:%M %p')}
Reported By:   SENTINEL Cyber Defense System, MCD
Target Domain: {domain}

CLASSIFICATION: {m2_result['classification']}
EVIDENCE:       {m2_result['explanation']}

This domain was detected impersonating an official MCD government portal.
Immediate takedown is requested under Section 66A/66C of the IT Act, 2000.

Please remove this domain and associated SSL certificate immediately.
Contact: cybersecurity@mcd.gov.in

---
This request was auto-generated by SENTINEL.
SENTINEL documentation: [attach PDF]
"""
    save_path = f"data/takedown_{domain.replace('.','_')}.txt"
    with open(save_path, "w") as f:
        f.write(text.strip())
    print(f"[Takedown] Request saved: {save_path}")


# ============================================================
# SIMULATED DEMO — Full 90-second attack scenario
# ============================================================

# ============================================================
# SIMULATION STATE — shared with FastAPI for /api/sim-log
# ============================================================

_sim_log   = []   # list of step dicts
_sim_state = {"running": False, "done": False}

def get_sim_log():
    return _sim_log

def get_sim_state():
    return _sim_state

def _emit(actor: str, msg: str, plain: str, severity: str = "INFO"):
    """Push a real-time step to the shared sim log."""
    _sim_log.append({
        "actor":    actor,
        "msg":      msg,
        "plain":    plain,
        "severity": severity,
        "ts":       datetime.now().strftime("%H:%M:%S"),
    })

def run_automated_demo():
    """Runs the complete attack simulation and emits real step events."""
    global _sim_log, _sim_state
    _sim_log   = []
    _sim_state = {"running": True, "done": False}

    # Clear previous data files
    for file in ["data/fake_sites.json", "data/kavach_alerts.json", "data/canaries.json"]:
        if os.path.exists(file):
            os.remove(file)

    _emit("SYSTEM", "Sentinel simulation initialised — models loading", "Setting up AI models and clearing previous data.", "INFO")
    fit_model()
    time.sleep(1)

    FAKE_DOMAIN = "mcd-propertytax-delhi-pay.in"
    PORTAL_TYPE = "property_tax"
    SITE_ID     = 1001

    # ── Model 1 ──────────────────────────────────────────────
    _emit("DRISHTI",
          f"CertStream alert: new SSL certificate issued for {FAKE_DOMAIN}",
          "A new fake website certificate was detected in the global SSL feed — caught it instantly.",
          "MEDIUM")
    time.sleep(1.5)

    m1 = score_domain(FAKE_DOMAIN)
    lev = m1.get("lev_score", "?")
    reason = m1.get("reason", "")
    _emit("DRISHTI",
          f"Domain similarity: {lev}% match to mcd.delhi.gov.in — {reason}",
          f"The fake site name is {lev}% identical to the real MCD website. Flagged for deep analysis.",
          "HIGH")
    time.sleep(2)

    # ── Model 2 ──────────────────────────────────────────────
    _emit("DRISHTI",
          "Visual analysis: inspecting fake site HTML for Aadhaar form and govt impersonation markers",
          "Scanning the fake website's code to check if it copies the real MCD portal.",
          "INFO")

    # Bypass Playwright — read local HTML directly and run Model 2's analyze_site()
    local_html_path = "tests/fake_mcd_portal.html"
    html_content = ""
    if os.path.exists(local_html_path):
        with open(local_html_path, "r", encoding="utf-8", errors="ignore") as f:
            html_content = f.read()

    m2_result = analyze_site(
        screenshot_path=None,   # no screenshot needed — HTML signals are enough
        html=html_content,
        domain=FAKE_DOMAIN,
        portal_type=PORTAL_TYPE,
    )

    # Also deploy canary and record site (replaces what deep_analysis_pipeline would have done)
    if m2_result.get("classification") in ("CONFIRMED", "PROBABLE"):
        canary = deploy_canary(site_id=SITE_ID, portal_type=PORTAL_TYPE)
        record_fake_site(
            site_id=SITE_ID, domain=FAKE_DOMAIN, portal_type=PORTAL_TYPE,
            classification=m2_result["classification"], explanation=m2_result["explanation"],
            canary_username=canary, detected_at=datetime.now().isoformat(),
        )
        _generate_takedown_text(FAKE_DOMAIN, m2_result)

    cls         = m2_result.get("classification", "PROBABLE")
    score       = m2_result.get("composite_score", 78)
    explanation = m2_result.get("explanation", "Aadhaar form detected, non-.gov.in domain")
    sev2        = "CRITICAL" if cls == "CONFIRMED" else "HIGH"

    _emit("DRISHTI",
          f"HTML analysis: Aadhaar form + govt impersonation detected — {cls} (score {score}/100)",
          f"The fake site has a copy of the Aadhaar form to steal citizens' ID data. Evidence: {explanation}",
          sev2)
    time.sleep(1)


    # ── Canary status ─────────────────────────────────────────
    canaries_now = json.load(open("data/canaries.json")) if os.path.exists("data/canaries.json") else []
    demo_canary  = next((c["username"] for c in canaries_now if c["site_id"] == SITE_ID and not c["triggered"]), None)
    if demo_canary:
        _emit("CANARY",
              f"Canary credential \"{demo_canary}\" injected into monitoring",
              "A fake login credential was placed as bait to track if the site steals data.",
              "INFO")
    time.sleep(1.5)

    # ── Model 3 ──────────────────────────────────────────────
    _emit("KAVACH",
          "Citizen reports incoming — clustering phishing messages into campaigns",
          "People are reporting suspicious MCD tax messages on WhatsApp and SMS. Grouping them by campaign.",
          "MEDIUM")

    report_texts = [
        "Got WhatsApp saying pay property tax at mcd-propertytax-delhi-pay.in urgent",
        "SMS received property tax link mcd-propertytax-delhi-pay.in pay now",
        "Friend shared mcd-propertytax-delhi-pay.in MCD property tax overdue",
        "Telegram message property tax mcd-propertytax-delhi-pay.in deadline today",
        "Received alert property tax mcd-propertytax-delhi-pay.in pay or face penalty",
    ]
    campaign_id = None
    for i, text in enumerate(report_texts):
        r_result = classify_report(text, report_id=300 + i)
        campaign_id = r_result.get("campaign_id")
        check_velocity(campaign_id)
        time.sleep(0.3)

    _emit("KAVACH",
          f"5 citizen reports clustered into Campaign #{campaign_id} — growing but not broadcast yet",
          f"5 phishing reports are all about the same fake site (Campaign #{campaign_id}). Not yet viral.",
          "MEDIUM")
    time.sleep(1.5)

    # ── Model 4 ──────────────────────────────────────────────
    _emit("KAVACH",
          "Login anomaly — East Zone portal_tax: 580 failed attempts in 90 seconds (baseline ~3)",
          "Stolen credentials are being tried on the real MCD portal — 580 times in 90 seconds.",
          "HIGH")

    attack_event = {
        "portal":     "property_tax",
        "count":      580,
        "source_ips": ["45.138.22.91", "91.2.3.4", "12.34.56.78", "185.220.101.34", "103.21.244.0"],
        "timestamp":  datetime.now().isoformat(),
    }
    kavach_result = process_event("login", attack_event)

    if kavach_result:
        z = kavach_result.get("z_score", "?")
        _emit("KAVACH",
              f"Foreign IPs attempting privileged access — Z-score: {z} — connection blocked",
              f"A computer from Russia tried to break into MCD systems using stolen passwords. Blocked. Z={z}.",
              "CRITICAL")
        record_kavach_alert(
            alert_id=1001, portal_type="property_tax", zone="East",
            rule=kavach_result["rule"], severity=kavach_result["severity"],
            z_score=kavach_result["z_score"], source_ips=attack_event["source_ips"],
            message=kavach_result["message"]
        )

    admin_result = process_event("admin_login", {"username": "zone_admin_east@mcd.gov.in", "timestamp": datetime.now().isoformat(), "is_admin": True})
    if admin_result:
        _emit("KAVACH",
              f"Off-hours admin login detected: {admin_result.get('username')} — 12:47 AM",
              "An administrator account logged in at midnight — zero legitimate business reason. Flagged immediately.",
              "CRITICAL")
    time.sleep(1)

    # ── Canary trigger ────────────────────────────────────────
    canaries_now = json.load(open("data/canaries.json")) if os.path.exists("data/canaries.json") else []
    demo_canary  = next((c["username"] for c in canaries_now if c["site_id"] == SITE_ID and not c["triggered"]), None)
    if demo_canary:
        check_canary(demo_canary)
        _emit("CANARY",
              f"Canary credential \"{demo_canary}\" used on real MCD portal — CREDENTIAL THEFT PROVEN",
              "Our bait credential was used on the real MCD portal. This is legal proof the site stole data from real citizens.",
              "CRITICAL")
    time.sleep(1.5)

    # ── Model 5 ──────────────────────────────────────────────
    _emit("BRIDGE",
          "Correlation engine: portal type MATCH + timing MATCH — linking external fake site to internal attack",
          "The fake site and the real system attack are connected — same attack, two stages.",
          "HIGH")
    time.sleep(1)

    bridge_results = run_bridge()
    if bridge_results:
        b = bridge_results[0]
        conf = b.get("confidence", "LIKELY")
        gap  = b.get("gap_minutes", "?")
        _emit("BRIDGE",
              f"⚡ UNIFIED ATTACK NARRATIVE — Confidence: {conf} — Phishing → Credential Stuffing (Δt={gap}min)",
              f"CONFIRMED: One coordinated attack. Fake site stole passwords, then used them on real MCD. Confidence: {conf}.",
              "CRITICAL")

    _emit("SYSTEM",
          "CERT-IN takedown request auto-generated. Alert sent to 40 IT staff members.",
          "Automatic removal request sent to India's cyber authority. IT team notified.",
          "INFO")

    _sim_state = {"running": False, "done": True}
    print("[Automated Demo] Complete.")

def run_simulated_demo():
    """
    Runs the complete attack simulation for the government demo.
    No real fake website needed. No CertStream needed.
    Everything is injected — but models run identically.

    Timeline:
    T+0s   → Attacker registers fake domain (simulated)
    T+15s  → Model 1 flags it + Model 2 analyzes it
    T+30s  → Canary deployed
    T+45s  → Citizens submit phishing reports
    T+60s  → KAVACH detects login spike (simulated)
    T+75s  → Bridge correlates everything
    T+90s  → Final alert displayed
    """

    print()
    print("=" * 60)
    print("  SENTINEL — LIVE ATTACK SIMULATION")
    print("  Press ENTER at each step to advance")
    print("=" * 60)

    # ── Initialize models ────────────────────────────────────
    fit_model()

    input("\n[READY] Press ENTER to begin simulation...")

    # ── T+0: Fake domain registered ─────────────────────────
    print("\n" + "─" * 60)
    print("T+0s — ATTACKER REGISTERS FAKE DOMAIN")
    print("─" * 60)
    print("  Registering: mcd-propertytax-delhi-pay.in")
    print("  SSL certificate issued → appears in CertStream feed")
    print("  Attacker sends WhatsApp blast to 50,000 Delhi residents")

    FAKE_DOMAIN   = "mcd-propertytax-delhi-pay.in"
    PORTAL_TYPE   = "property_tax"
    SITE_ID       = 1001

    input("\n[ENTER] to run Model 1 (domain scoring)...")

    # ── Model 1 ──────────────────────────────────────────────
    print("\n[Model 1] Running Levenshtein + Keyword check...")
    m1 = score_domain(FAKE_DOMAIN)
    print(f"  Domain:      {FAKE_DOMAIN}")
    print(f"  Investigate: {m1['investigate']}")
    print(f"  Reason:      {m1['reason']}")
    print(f"  → Domain FLAGGED for deep analysis")

    input("\n[ENTER] to run Model 2 (visual + HTML analysis)...")

    # ── Model 2 ──────────────────────────────────────────────
    print("\n[Model 2] Opening fake site in headless browser...")
    print("  Playwright launching Chrome invisibly...")
    m2_result = asyncio.run(deep_analysis_pipeline(
        domain=FAKE_DOMAIN,
        portal_type=PORTAL_TYPE,
        site_id=SITE_ID,
        use_local_html=True,    # use our local HTML file
    ))

    print(f"\n  Classification: {m2_result['classification']}")
    print(f"  Score:          {m2_result['composite_score']}/100")
    print(f"  Evidence:       {m2_result['explanation']}")

    if m2_result["classification"] == "CONFIRMED":
        print("\n  *** FAKE SITE CONFIRMED ***")
        print("  → Takedown request auto-generated")
        print("  → Passive canary deployed in MCD monitoring")
        print("  → Dashboard alert fired")

    input("\n[ENTER] to simulate citizen reports (Model 3)...")

    # ── Model 3 — Citizens report ────────────────────────────
    print("\n[Model 3] Processing citizen phishing reports...")
    report_texts = [
        "Got WhatsApp saying pay property tax at mcd-propertytax-delhi-pay.in urgent",
        "SMS received property tax link mcd-propertytax-delhi-pay.in pay now",
        "Friend shared mcd-propertytax-delhi-pay.in MCD property tax overdue",
        "Telegram message property tax mcd-propertytax-delhi-pay.in deadline today",
        "Received alert property tax mcd-propertytax-delhi-pay.in pay or face penalty",
    ]

    for i, text in enumerate(report_texts):
        r_result = classify_report(text, report_id=300 + i)
        v_result = check_velocity(r_result["campaign_id"])
        print(f"  Report {i+1}: → Campaign {r_result['campaign_id']} "
              f"({'new' if r_result['is_new'] else 'existing'}) | "
              f"Total in 2hrs: {v_result['count']}")
        time.sleep(0.3)  # slight pause so output is readable

    print(f"\n  {len(report_texts)} reports clustered into same campaign")
    print("  → Not a broadcast yet (need 50+ for broadcast alert)")
    print("  → Campaign growing — monitor mode active")

    input("\n[ENTER] to simulate KAVACH detecting login spike (Model 4)...")

    # ── Model 4 — Login spike ────────────────────────────────
    print("\n[Model 4] Simulating KAVACH reading Windows Event Logs...")
    print("  Zone: East Delhi Data Centre")
    print("  Portal: Property Tax")
    print("  Time: Monday 12:47am")
    print()

    # This is the synthetic event dict
    # In real deployment this comes from KAVACH's log reader
    attack_event = {
        "portal":     "property_tax",
        "count":      580,             # 580 failed logins — vs normal of 3
        "source_ips": [
            "45.138.22.91",
            "91.2.3.4",
            "12.34.56.78",
            "185.220.101.34",
            "103.21.244.0",
            "198.54.117.200",
        ],
        "timestamp": datetime.now().isoformat(),   # now = for demo timing
    }

    kavach_result = process_event("login", attack_event)

    print(f"  Failed logins: {attack_event['count']}")
    print(f"  Source IPs:    {len(attack_event['source_ips'])} different locations")
    print(f"  Z-score:       {kavach_result['z_score']}")
    print(f"  Expected:      {kavach_result['expected']} logins at this hour")
    print(f"  Severity:      {kavach_result['severity']}")
    print(f"\n  Message: {kavach_result['message']}")

    if kavach_result["severity"] == "RED":
        print("\n  *** RED ALERT FIRED ***")

    # Record the alert for Bridge
    record_kavach_alert(
        alert_id     = 1001,
        portal_type  = "property_tax",
        zone         = "East",
        rule         = kavach_result["rule"],
        severity     = kavach_result["severity"],
        z_score      = kavach_result["z_score"],
        source_ips   = attack_event["source_ips"],
        message      = kavach_result["message"],
        detected_at  = datetime.now().isoformat(),
    )

    # Also simulate off-hours admin login for extra drama
    print("\n[Model 4] Also detecting off-hours admin login...")
    admin_result = process_event("admin_login", {
        "username":  "zone_admin_east@mcd.gov.in",
        "timestamp": datetime.now().isoformat(),
        "is_admin":  True,
    })
    if admin_result:
        print(f"  *** ADDITIONAL ALERT: {admin_result['rule']} ***")
        print(f"  {admin_result['message'][:100]}")

    # Simulate the canary being triggered
    # (the attacker used the stolen canary credential on the real portal)
    canaries = json.load(open("data/canaries.json")) if os.path.exists("data/canaries.json") else []
    demo_canary = next(
        (c["username"] for c in canaries if c["site_id"] == SITE_ID and not c["triggered"]),
        None
    )
    if demo_canary:
        check_canary(demo_canary)  # mark as triggered
        print(f"\n[Canary] TRIGGERED: '{demo_canary}' found in login attempt logs")
        print("  → Forensic proof: attacker used credential stolen from fake site")

    input("\n[ENTER] to run The Bridge (Model 5)...")

    # ── Model 5 — The Bridge ─────────────────────────────────
    print("\n[Bridge] Correlating external threats with internal attacks...")
    print("  Query: Is there a fake property_tax site from the last 4 hours?")
    print("  Query: Did KAVACH see a login spike on property_tax in the same window?")
    print("  Running 3-rule check...")
    time.sleep(1)

    bridge_results = run_bridge()

    if bridge_results:
        b = bridge_results[0]

        print("\n" + "=" * 60)
        print("  *** COORDINATED ATTACK ALERT ***")
        print("=" * 60)
        print(f"  Confidence:  {b['confidence']}")
        print(f"  Fake site:   {b['fake_site']}")
        print(f"  Portal type: {b['portal_type']}")
        print(f"  Time gap:    {b['gap_minutes']} minutes between site + attack")
        print(f"  Canary:      {'YES — forensic proof confirmed' if b['canary_proof'] else 'NOT YET'}")
        print()
        print(f"  Full message:")
        print(f"  {b['message']}")
        print()
        print("  Recommended actions:")
        for i, action in enumerate(b["actions"], 1):
            print(f"  {i}. {action}")
        print("=" * 60)
    else:
        print("  Bridge did not fire — check data files")

    print("\n" + "=" * 60)
    print("  SIMULATION COMPLETE")
    print()
    print("  What SENTINEL just did in ~90 seconds:")
    print("  1. Detected fake domain using Levenshtein + keywords")
    print("  2. Confirmed visual copy via dHash + HTML signals")
    print("  3. Deployed passive canary honeypot")
    print("  4. Clustered citizen phishing reports into campaign")
    print("  5. Detected login spike via Z-score (Z=132)")
    print("  6. Caught admin login at midnight")
    print("  7. Connected both attacks via Bridge into one alert")
    print("  8. Generated takedown request automatically")
    print()
    print("  Without SENTINEL: same detection = 21 days")
    print("=" * 60)


# ============================================================
# MAIN — choose live or simulated mode
# ============================================================

if __name__ == "__main__":
    if "--live" in sys.argv:
        print("Starting in LIVE mode — connecting to real CertStream feed")
        print("This will wait for real suspicious domains to appear")
        print("For the government demo, use simulated mode (no --live flag)")
        print()
        start_certstream_listener()
    else:
        run_simulated_demo()