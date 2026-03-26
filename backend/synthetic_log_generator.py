#!/usr/bin/env python3
"""
SENTINEL — Synthetic Log Generator
====================================
Generates 100+ realistic logs covering ALL SENTINEL subsystems:
  - DRISHTI   : External fake portal detection
  - KAVACH    : Internal Windows login anomaly detection
  - BRIDGE    : Cross-reality correlation engine
  - ALERT     : Alert dispatch, takedown requests, weekly reports
  - SYSTEM    : API, scheduler, WebSocket, synthetic metadata

Output: logs/ directory with one .jsonl file per log type
        + logs/ALL_SENTINEL_LOGS.jsonl (merged, chronologically sorted)
        + logs/SUMMARY.json (stats)

Usage:
    python synthetic_log_generator.py
"""

import json
import os
import random
import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ─────────────────────────── CONFIG ───────────────────────────
SEED = 42
random.seed(SEED)
OUTPUT_DIR = Path("logs")
OUTPUT_DIR.mkdir(exist_ok=True)

# ─────────────────────────── SHARED DATA ──────────────────────
MCD_ZONES = ["SOUTH", "EAST", "NORTH", "WEST", "CENTRAL", "ROHINI",
             "SHAHDARA_NORTH", "SHAHDARA_SOUTH", "CITY_SP", "NAJAFGARH",
             "CIVIL_LINES", "KAROL_BAGH"]

REAL_PORTALS = [
    "mcdonline.gov.in",
    "mcdlogin.gov.in",
    "mcdpayments.gov.in",
    "mcdgrievance.gov.in",
    "mcdtax.gov.in",
]

FAKE_DOMAIN_TEMPLATES = [
    "mcd-online-payment.in",       "mcdonline-gov.in",
    "mcd-payment-portal.com",      "mcdonlinepayment.net",
    "mcd-gov-in.com",              "mcdpayment-india.in",
    "mcd0nline.in",                "mcdonIine.gov.in",
    "mcd-official-portal.com",     "delhimcd-pay.in",
    "mcdcorporation-pay.in",       "mcd-delhi-pay.net",
    "mcdonline.gov.in.fake-site.com", "mcd-tax-portal.in",
    "mcdtaxpay.in",                "mcd-grievance-portal.net",
    "mcd-aadhaar-verify.in",       "delhi-mcd.net",
    "mcdgov.in",                   "mcd-online-services.in",
]

ISSUERS = [
    "Let's Encrypt Authority X3",
    "Let's Encrypt R3",
    "ZeroSSL RSA Domain Secure Site CA",
    "Sectigo RSA Domain Validation Secure Server CA",
    "GoDaddy Secure Certificate Authority - G2",
]

REGISTRARS = [
    ("GoDaddy LLC", "abuse@godaddy.com"),
    ("Namecheap Inc.", "abuse@namecheap.com"),
    ("BigRock Solutions", "abuse@bigrock.in"),
    ("ResellerClub", "abuse@resellerclub.com"),
    ("Hostinger International", "abuse@hostinger.com"),
]

ATTACKER_IPS_FOREIGN = [
    "185.220.101.47", "198.54.117.200", "104.21.45.89",
    "45.142.212.100", "194.165.16.11", "91.108.56.130",
    "5.188.206.14",   "62.210.130.250", "178.128.48.31",
    "103.21.244.0",
]

INTERNAL_IPS = [f"10.{random.randint(1,15)}.{random.randint(1,60)}.{random.randint(1,254)}" for _ in range(40)]

MCD_MACHINES = [f"{zone}-DC{str(i).zfill(2)}" for zone in MCD_ZONES for i in range(1, 4)]
MCD_MACHINES += [f"{zone}-WS{str(i).zfill(2)}" for zone in MCD_ZONES[:6] for i in range(1, 6)]

USERNAMES = [
    "admin.kumar", "rajesh.sharma", "priya.singh", "deepak.verma",
    "sunita.yadav", "amit.gupta", "neha.mishra", "vivek.pandey",
    "kavita.joshi", "rohit.nair", "sanjay.menon", "pooja.iyer",
    "arun.reddy", "meena.patel", "suresh.chandra", "anita.dubey",
    "rakesh.tiwari", "geeta.bose", "manoj.saxena", "usha.agarwal",
]

FAILURE_REASONS = [
    ("WRONG_PASSWORD", "0xC000006A"),
    ("ACCOUNT_EXPIRED", "0xC0000193"),
    ("ACCOUNT_LOCKED", "0xC0000234"),
    ("BAD_USERNAME", "0xC0000064"),
    ("CLOCK_SKEW", "0xC0000133"),
]

VARIANT_TYPES = [
    "hyphenation", "subdomain", "tld_swap", "homoglyph",
    "addition", "omission", "transposition", "keyword_prefix",
    "keyword_suffix", "bit_squatting",
]

GEO_DATA = [
    ("NL", "Amsterdam", "AS206150"),
    ("DE", "Frankfurt", "AS24940"),
    ("RU", "Moscow", "AS197695"),
    ("CN", "Beijing", "AS4134"),
    ("US", "Ashburn", "AS396982"),
    ("SG", "Singapore", "AS16509"),
    ("GB", "London", "AS15169"),
    ("FR", "Paris", "AS12876"),
]

PATTERN_TYPES = [
    "CREDENTIAL_STUFFING",
    "BRUTE_FORCE",
    "PASSWORD_SPRAY",
    "LATERAL_MOVEMENT",
    "ACCOUNT_ENUMERATION",
]

# ─────────────────────────── UTILITIES ────────────────────────

BASE_TIME = datetime(2024, 3, 15, 8, 0, 0, tzinfo=timezone.utc)

# Pre-compute ISO week number — compatible with ALL Python versions (3.7+)
# isocalendar() returns a tuple (year, week, weekday) in Python < 3.9
# and a named tuple in Python 3.9+. Index [1] works for both.
_ISO_WEEK = BASE_TIME.isocalendar()[1]

def ts(offset_minutes: float) -> str:
    """Return ISO8601 timestamp offset from BASE_TIME."""
    t = BASE_TIME + timedelta(minutes=offset_minutes)
    ms = int((offset_minutes % 1) * 1000)
    return t.strftime(f"%Y-%m-%dT%H:%M:%S.{ms:03d}Z")

def ts_date(offset_days: int) -> str:
    t = BASE_TIME + timedelta(days=offset_days)
    return t.strftime("%Y-%m-%d")

def new_id(prefix: str, n: int) -> str:
    return f"{prefix}-{BASE_TIME.strftime('%Y%m%d')}-{str(n).zfill(7)}"

def short_id(prefix: str, n: int) -> str:
    return f"{prefix}-{BASE_TIME.year}-{str(n).zfill(4)}"

def canary_username(cid: str) -> str:
    return f"sntl_trap_{cid[:8]}"

def fake_phash() -> str:
    return uuid.uuid4().hex[:16]

def similar_phash(base: str) -> str:
    chars = list(base)
    for i in random.sample(range(len(chars)), random.randint(1, 3)):
        chars[i] = random.choice("0123456789abcdef")
    return "".join(chars)

def bcrypt_stub() -> str:
    return f"$2b$12${uuid.uuid4().hex[:22]}...REDACTED"

def write_jsonl(filename: str, records: list) -> Path:
    path = OUTPUT_DIR / filename
    with open(path, "w") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    return path

# ════════════════════════════════════════════════════════════════
# CAMPAIGN STATE — shared across generators so IDs cross-link
# ════════════════════════════════════════════════════════════════

campaigns = []   # list of dicts describing each campaign
canary_map = {}  # canary_id -> campaign dict

# ════════════════════════════════════════════════════════════════
# 1. DRISHTI — CERTSTREAM EVENTS
# ════════════════════════════════════════════════════════════════

def gen_certstream_events(n=25) -> list:
    records = []
    for i in range(n):
        offset = random.uniform(0, 55)
        fake_dom = random.choice(FAKE_DOMAIN_TEMPLATES)
        target = random.choice(REAL_PORTALS)
        lev = random.randint(2, 12)
        flagged = lev <= 7
        issuer = random.choice(ISSUERS)
        not_before_offset = offset - random.uniform(0, 10)
        cert_id = new_id("CERT", 42800 + i)

        rec = {
            "log_type": "CERTSTREAM_EVENT",
            "event_id": cert_id,
            "timestamp": ts(offset),
            "domain": fake_dom,
            "san_domains": [fake_dom, f"www.{fake_dom}"],
            "issuer": issuer,
            "not_before": ts(not_before_offset),
            "not_after": ts(not_before_offset + 60 * 24 * 90),
            "levenshtein_score": lev,
            "matched_keyword": random.choice(["mcd", "delhi", "mcdonline", "gov"]),
            "target_domain": target,
            "flagged": flagged,
            "trigger": "KEYWORD_MATCH + LEVENSHTEIN_THRESHOLD" if flagged else "KEYWORD_MATCH_ONLY",
            "queued_for_dnstwist": flagged,
        }
        records.append(rec)

        if flagged and lev <= 5 and len(campaigns) < 10:
            camp_id = short_id("THR", len(campaigns) + 300)
            cam_offset = offset
            campaigns.append({
                "cert_id": cert_id,
                "fake_dom": fake_dom,
                "target": target,
                "lev": lev,
                "issuer": issuer,
                "attacker_ip": random.choice(ATTACKER_IPS_FOREIGN),
                "geo": random.choice(GEO_DATA),
                "registrar": random.choice(REGISTRARS),
                "threat_id": camp_id,
                "cam_offset": cam_offset,
                "zone": random.choice(MCD_ZONES),
                "tfidf": round(random.uniform(0.65, 0.92), 2),
                "dhash": random.randint(1, 6),
                "sim_pct": round(random.uniform(80.0, 96.0), 1),
                "phash_ref": fake_phash(),
            })

    return records

# ════════════════════════════════════════════════════════════════
# 2. DRISHTI — DNSTWIST SCANS
# ════════════════════════════════════════════════════════════════

def gen_dnstwist_scans() -> list:
    records = []
    for i, c in enumerate(campaigns):
        offset = c["cam_offset"] + random.uniform(0.2, 0.5)
        country, city, asn = c["geo"]
        reg_name, _ = c["registrar"]
        rec = {
            "log_type": "DNSTWIST_SCAN",
            "scan_id": new_id("DNS", 42800 + i),
            "timestamp": ts(offset),
            "source_event_id": c["cert_id"],
            "original_domain": c["target"],
            "suspect_domain": c["fake_dom"],
            "variant_type": random.choice(VARIANT_TYPES),
            "dns_resolved": True,
            "ip_address": c["attacker_ip"],
            "geo_country": country,
            "geo_city": city,
            "asn": asn,
            "mx_records": random.choice([True, False]),
            "registrar": reg_name,
            "whois_created": ts_date(-random.randint(0, 3)),
            "domain_age_days": random.randint(0, 3),
            "risk_flags": random.sample(
                ["NEW_DOMAIN", "FOREIGN_HOSTED", "GOV_IMPERSONATION",
                 "NO_MX_RECORDS", "FREE_TLS", "SUSPICIOUS_REGISTRAR"],
                k=random.randint(2, 4),
            ),
            "queued_for_screenshot": True,
        }
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# 3. DRISHTI — SCREENSHOT ANALYSIS
# ════════════════════════════════════════════════════════════════

def gen_screenshot_analysis() -> list:
    records = []
    for i, c in enumerate(campaigns):
        offset = c["cam_offset"] + random.uniform(0.5, 1.2)
        phash_ref = c["phash_ref"]
        phash_sus = similar_phash(phash_ref)
        verdict = "CONFIRMED_PHISHING" if c["sim_pct"] >= 80 else "SUSPICIOUS"
        rec = {
            "log_type": "SCREENSHOT_ANALYSIS",
            "analysis_id": new_id("SCRN", 42800 + i),
            "timestamp": ts(offset),
            "source_scan_id": new_id("DNS", 42800 + i),
            "suspect_domain": c["fake_dom"],
            "reference_portal": c["target"],
            "screenshot_path": f"screens/{c['cert_id']}.png",
            "phash_suspect": phash_sus,
            "phash_reference": phash_ref,
            "dhash_distance": c["dhash"],
            "visual_similarity_pct": c["sim_pct"],
            "threshold": 80.0,
            "visual_match": c["sim_pct"] >= 80.0,
            "page_title": f"{'MCD' if 'mcd' in c['fake_dom'] else 'Delhi Municipal'} Online {random.choice(['Payment', 'Services', 'Portal', 'Login'])}",
            "has_payment_form": random.choice([True, True, False]),
            "has_aadhaar_field": random.choice([True, False]),
            "has_login_form": True,
            "form_action_url": f"https://{c['fake_dom']}/submit",
            "tfidf_content_score": c["tfidf"],
            "verdict": verdict,
        }
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# 4. DRISHTI — DOMAIN THREAT (master record)
# ════════════════════════════════════════════════════════════════

def gen_domain_threats() -> list:
    records = []
    for i, c in enumerate(campaigns):
        offset = c["cam_offset"] + random.uniform(1.2, 2.0)
        canary_id = f"CAN-{uuid.UUID(int=random.getrandbits(128))}"
        c["canary_id"] = canary_id
        c["threat_offset"] = offset
        canary_map[canary_id] = c

        rec = {
            "log_type": "DOMAIN_THREAT",
            "threat_id": c["threat_id"],
            "timestamp": ts(offset),
            "cert_event_id": c["cert_id"],
            "suspect_domain": c["fake_dom"],
            "target_portal": c["target"],
            "threat_type": "GOV_PORTAL_IMPERSONATION",
            "severity": "CRITICAL" if c["sim_pct"] >= 85 else "HIGH",
            "confidence_pct": c["sim_pct"],
            "levenshtein": c["lev"],
            "dhash_distance": c["dhash"],
            "tfidf_score": c["tfidf"],
            "attacker_ip": c["attacker_ip"],
            "canary_planted": True,
            "canary_id": canary_id,
            "status": "ACTIVE_MONITORING",
            "takedown_filed": False,
            "assigned_zone": "DRISHTI",
        }
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# 5. BRIDGE — CANARY PLANTED
# ════════════════════════════════════════════════════════════════

def gen_canary_planted() -> list:
    records = []
    for i, c in enumerate(campaigns):
        offset = c["threat_offset"] + random.uniform(0.2, 0.5)
        c["canary_planted_offset"] = offset
        rec = {
            "log_type": "CANARY_PLANTED",
            "canary_id": c["canary_id"],
            "timestamp": ts(offset),
            "threat_id": c["threat_id"],
            "fake_domain": c["fake_dom"],
            "target_portal": c["target"],
            "canary_username": canary_username(c["canary_id"]),
            "canary_password_hash": bcrypt_stub(),
            "delivery_method": random.choice([
                "FORM_SUBMISSION_SIMULATION",
                "HEADLESS_BROWSER_SUBMIT",
                "SYNTHETIC_VICTIM_REQUEST",
            ]),
            "expiry_timestamp": ts(offset + 60 * 24 * 7),
            "monitoring_active": True,
            "watch_portals": REAL_PORTALS,
        }
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# 6. KAVACH — WINDOWS RAW EVENTS (bulk — most log volume)
# ════════════════════════════════════════════════════════════════

WIN_EVENT_TYPES = [
    (4624, "LOGON_SUCCESS",       "N/A",           None),
    (4625, "LOGON_FAILURE",       "WRONG_PASSWORD", "0xC000006A"),
    (4625, "LOGON_FAILURE",       "ACCOUNT_LOCKED", "0xC0000234"),
    (4625, "LOGON_FAILURE",       "BAD_USERNAME",   "0xC0000064"),
    (4648, "EXPLICIT_CRED_LOGON", "N/A",            None),
    (4740, "ACCOUNT_LOCKOUT",     "N/A",            None),
    (4776, "NTLM_AUTH_ATTEMPT",   "N/A",            None),
    (4768, "KERBEROS_TGT_REQUEST","N/A",            None),
    (4719, "AUDIT_POLICY_CHANGE", "N/A",            None),
]

def gen_windows_events(n=200) -> list:
    records = []

    for i in range(int(n * 0.55)):
        etype = random.choices(WIN_EVENT_TYPES, weights=[40,8,2,2,3,1,4,5,1], k=1)[0]
        eid, ename, freason, fcode = etype
        zone = random.choice(MCD_ZONES)
        machine = random.choice([m for m in MCD_MACHINES if zone in m] or MCD_MACHINES)
        offset = random.uniform(0, 60)
        rec = {
            "log_type": "WINDOWS_EVENT_RAW",
            "ingest_id": new_id("EVT", 190000 + i),
            "timestamp": ts(offset),
            "event_id": eid,
            "event_name": ename,
            "computer_name": machine,
            "zone": zone,
            "ip_address": random.choice(INTERNAL_IPS),
            "username": random.choice(USERNAMES),
            "domain": "MCD-CORP",
            "logon_type": random.choice([2, 3, 10]),
            "logon_type_name": random.choice(["INTERACTIVE", "NETWORK", "REMOTE_INTERACTIVE"]),
            "failure_reason": freason,
            "failure_code": fcode,
            "workstation": machine if random.random() > 0.3 else "UNKNOWN",
            "auth_package": random.choice(["NTLM", "Kerberos", "Negotiate"]),
            "source_file": "Security.evtx",
            "baseline_period": True,
        }
        records.append(rec)

    attack_campaigns = campaigns[:5]
    for i, c in enumerate(attack_campaigns):
        attack_start = c["cam_offset"] + random.uniform(60, 180)
        c["attack_start_offset"] = attack_start
        src_ip = c["attacker_ip"]
        zone = c["zone"]

        for j in range(random.randint(18, 30)):
            offset = attack_start + random.uniform(0, 12)
            freason, fcode = random.choice(FAILURE_REASONS[:3])
            user = random.choice(USERNAMES)
            machine = random.choice([m for m in MCD_MACHINES if zone in m] or MCD_MACHINES)
            rec = {
                "log_type": "WINDOWS_EVENT_RAW",
                "ingest_id": new_id("EVT", 190000 + int(n * 0.55) + i * 30 + j),
                "timestamp": ts(offset),
                "event_id": 4625,
                "event_name": "LOGON_FAILURE",
                "computer_name": machine,
                "zone": zone,
                "ip_address": src_ip,
                "username": user,
                "domain": "MCD-CORP",
                "logon_type": 3,
                "logon_type_name": "NETWORK",
                "failure_reason": freason,
                "failure_code": fcode,
                "workstation": "UNKNOWN",
                "auth_package": "NTLM",
                "source_file": "Security.evtx",
                "baseline_period": False,
                "attack_marker": True,
                "linked_threat_id": c["threat_id"],
            }
            records.append(rec)

        canary_offset = attack_start + random.uniform(15, 45)
        c["canary_trigger_offset"] = canary_offset
        machine = random.choice([m for m in MCD_MACHINES if zone in m] or MCD_MACHINES)
        records.append({
            "log_type": "WINDOWS_EVENT_RAW",
            "ingest_id": new_id("EVT", 290000 + i),
            "timestamp": ts(canary_offset),
            "event_id": 4625,
            "event_name": "LOGON_FAILURE",
            "computer_name": machine,
            "zone": zone,
            "ip_address": c["attacker_ip"],
            "username": canary_username(c["canary_id"]),
            "domain": "MCD-CORP",
            "logon_type": 3,
            "logon_type_name": "NETWORK",
            "failure_reason": "WRONG_PASSWORD",
            "failure_code": "0xC000006A",
            "workstation": "UNKNOWN",
            "auth_package": "NTLM",
            "source_file": "Security.evtx",
            "baseline_period": False,
            "canary_event": True,
            "canary_id": c["canary_id"],
        })

    return records

# ════════════════════════════════════════════════════════════════
# 7. KAVACH — Z-SCORE ANOMALIES
# ════════════════════════════════════════════════════════════════

def gen_zscore_anomalies() -> list:
    records = []
    for i, c in enumerate(campaigns[:5]):
        offset = c.get("attack_start_offset", 70) + random.uniform(0.5, 2.0)
        count_obs = random.randint(80, 200)
        mean = round(random.uniform(3.0, 8.0), 1)
        std = round(random.uniform(1.0, 3.0), 1)
        z = round((count_obs - mean) / std, 1)
        pat_type = random.choice(PATTERN_TYPES)
        rec = {
            "log_type": "ZSCORE_ANOMALY",
            "anomaly_id": new_id("ZSC", i + 1),
            "timestamp": ts(offset),
            "zone": c["zone"],
            "machine": random.choice([m for m in MCD_MACHINES if c["zone"] in m] or MCD_MACHINES),
            "window_start": ts(offset - 12),
            "window_end": ts(offset),
            "window_minutes": 12,
            "event_type": "LOGON_FAILURE",
            "count_observed": count_obs,
            "baseline_mean": mean,
            "baseline_stddev": std,
            "z_score": z,
            "threshold": 3.0,
            "severity": "CRITICAL" if z > 30 else "HIGH" if z > 10 else "MEDIUM",
            "pattern_type": pat_type,
            "unique_users_targeted": random.randint(40, 120),
            "unique_source_ips": random.randint(1, 3),
            "linked_threat_id": c["threat_id"],
            "forwarded_to_bridge": True,
        }
        c["zscore_id"] = rec["anomaly_id"]
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# 8. KAVACH — PATTERN DETECTION
# ════════════════════════════════════════════════════════════════

def gen_pattern_detections() -> list:
    records = []
    for i, c in enumerate(campaigns[:5]):
        offset = c.get("attack_start_offset", 70) + random.uniform(2.0, 4.0)
        pat_type = random.choice(PATTERN_TYPES)
        rec = {
            "log_type": "PATTERN_DETECTION",
            "pattern_id": new_id("PAT", i + 20),
            "timestamp": ts(offset),
            "zscore_event_id": c.get("zscore_id", "ZSC-UNKNOWN"),
            "zone": c["zone"],
            "pattern_type": pat_type,
            "indicators": {
                "many_users_one_ip": True,
                "rapid_sequential_attempts": True,
                "attempts_per_minute": round(random.uniform(8.0, 20.0), 2),
                "lockouts_triggered": random.randint(5, 25),
                "known_credential_list": random.choice([True, False]),
            },
            "attack_window_sec": random.randint(480, 900),
            "source_ip": c["attacker_ip"],
            "severity": "HIGH",
            "recommended_action": f"BLOCK_IP_{c['zone']}ZONE",
            "linked_threat_id": c["threat_id"],
            "forwarded_to_bridge": True,
        }
        c["pattern_id"] = rec["pattern_id"]
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# 9. KAVACH — CROSS-ZONE ANOMALY
# ════════════════════════════════════════════════════════════════

def gen_cross_zone_anomalies() -> list:
    records = []
    ip_groups: dict = {}
    for c in campaigns[:5]:
        ip_groups.setdefault(c["attacker_ip"], []).append(c)

    czc_n = 0
    for attacker_ip, grp in ip_groups.items():
        if len(grp) < 2:
            continue
        max_offset = max(c.get("attack_start_offset", 70) for c in grp) + 5
        zones = list({c["zone"] for c in grp})
        rec = {
            "log_type": "CROSS_ZONE_ANOMALY",
            "correlation_id": new_id("CZA", czc_n + 1),
            "timestamp": ts(max_offset),
            "zones_involved": zones,
            "contributing_patterns": [c.get("pattern_id", "PAT-UNKNOWN") for c in grp],
            "contributing_zscore_ids": [c.get("zscore_id", "ZSC-UNKNOWN") for c in grp],
            "shared_source_ip": attacker_ip,
            "time_span_minutes": round(random.uniform(2.0, 8.0), 1),
            "total_failed_attempts": sum(random.randint(80, 160) for _ in grp),
            "total_zones_hit": len(zones),
            "escalated_severity": "CRITICAL",
            "assessment": "COORDINATED_MULTI_ZONE_ATTACK",
            "forwarded_to_bridge": True,
        }
        czc_n += 1
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# 10. BRIDGE — CANARY TRIGGERED
# ════════════════════════════════════════════════════════════════

def gen_canary_triggered() -> list:
    records = []
    for i, c in enumerate(campaigns[:5]):
        offset = c.get("canary_trigger_offset", 150)
        planted = c.get("canary_planted_offset", 10)
        minutes_since = round((offset - planted), 1)
        rec = {
            "log_type": "CANARY_TRIGGERED",
            "trigger_id": new_id("TRIG", i + 1),
            "timestamp": ts(offset),
            "canary_id": c["canary_id"],
            "canary_username": canary_username(c["canary_id"]),
            "seen_on_portal": c["target"],
            "attempt_ip": c["attacker_ip"],
            "attempt_timestamp": ts(offset - 0.03),
            "minutes_since_phishing": minutes_since,
            "within_campaign_window": minutes_since <= 360,
            "forensic_certainty": "CONFIRMED",
            "evidence_type": "CANARY_CREDENTIAL_REPLAY",
            "linked_threat_id": c["threat_id"],
            "court_admissible": True,
        }
        c["trigger_id"] = rec["trigger_id"]
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# 11. BRIDGE — CAMPAIGN CORRELATION (master)
# ════════════════════════════════════════════════════════════════

def gen_campaign_correlations() -> list:
    records = []
    for i, c in enumerate(campaigns[:5]):
        offset = c.get("canary_trigger_offset", 150) + 0.12
        phish_start = c["cam_offset"]
        cred_use = c.get("canary_trigger_offset", 150)
        window_hours = round((cred_use - phish_start) / 60, 2)
        rec = {
            "log_type": "CAMPAIGN_CORRELATION",
            "campaign_id": short_id("CAM", 80 + i),
            "timestamp": ts(offset),
            "correlation_method": "CANARY_FORENSIC",
            "external_threat_id": c["threat_id"],
            "internal_pattern_id": c.get("pattern_id", "PAT-UNKNOWN"),
            "canary_trigger_id": c.get("trigger_id", "TRIG-UNKNOWN"),
            "phishing_domain": c["fake_dom"],
            "attacker_ip": c["attacker_ip"],
            "phishing_start": ts(phish_start),
            "credential_use_start": ts(cred_use),
            "campaign_window_hours": window_hours,
            "estimated_victims": "UNKNOWN — investigation ongoing",
            "severity": "CRITICAL",
            "confidence": "FORENSIC_CONFIRMED",
            "graph_nodes": [
                {"id": "fake_site",  "label": c["fake_dom"],      "type": "PHISHING_DOMAIN"},
                {"id": "canary",     "label": c["canary_id"][:20], "type": "HONEYPOT_CREDENTIAL"},
                {"id": "real_portal","label": c["target"],         "type": "REAL_PORTAL"},
                {"id": "attacker",   "label": c["attacker_ip"],    "type": "THREAT_ACTOR_IP"},
            ],
            "graph_edges": [
                {"from": "fake_site", "to": "canary",      "relation": "HARVESTED"},
                {"from": "canary",    "to": "real_portal", "relation": "REPLAYED_AT"},
                {"from": "attacker",  "to": "fake_site",   "relation": "OPERATED"},
            ],
        }
        c["campaign_id"] = rec["campaign_id"]
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# 12. ALERT — ALERT DISPATCHED
# ════════════════════════════════════════════════════════════════

def gen_alert_dispatched() -> list:
    records = []
    n = 0
    for i, c in enumerate(campaigns[:5]):
        offset = c.get("canary_trigger_offset", 150) + 0.2
        severities = ["CRITICAL", "HIGH", "HIGH", "CRITICAL", "HIGH"]
        for severity in [severities[i]]:
            rec = {
                "log_type": "ALERT_DISPATCHED",
                "alert_id": new_id("ALT", n + 40),
                "timestamp": ts(offset),
                "campaign_id": c.get("campaign_id", "CAM-UNKNOWN"),
                "threat_id": c["threat_id"],
                "severity": severity,
                "alert_type": "CAMPAIGN_CONFIRMED",
                "channel": "EMAIL",
                "recipients": [
                    "ciso@mcd.gov.in",
                    f"it-{c['zone'].lower()}@mcd.gov.in",
                    "commissioner@mcd.gov.in" if severity == "CRITICAL" else "it-ops@mcd.gov.in",
                ],
                "subject": f"[SENTINEL {severity}] Phishing-to-credential attack confirmed — {c['fake_dom']}",
                "delivery_status": "DELIVERED",
                "smtp_response": "250 OK",
                "latency_ms": random.randint(180, 600),
                "ws_broadcast": True,
            }
            n += 1
            records.append(rec)

    for i in range(5):
        offset = random.uniform(80, 200)
        zone = random.choice(MCD_ZONES)
        rec = {
            "log_type": "ALERT_DISPATCHED",
            "alert_id": new_id("ALT", n + 40 + i),
            "timestamp": ts(offset),
            "campaign_id": None,
            "threat_id": None,
            "severity": "HIGH",
            "alert_type": "LOGIN_ANOMALY_SPIKE",
            "channel": "EMAIL",
            "recipients": [f"it-{zone.lower()}@mcd.gov.in", "it-ops@mcd.gov.in"],
            "subject": f"[SENTINEL HIGH] Abnormal login failure spike — {zone} Zone",
            "delivery_status": "DELIVERED",
            "smtp_response": "250 OK",
            "latency_ms": random.randint(200, 800),
            "ws_broadcast": True,
        }
        n += 1
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# 13. ALERT — TAKEDOWN REQUESTS
# ════════════════════════════════════════════════════════════════

def gen_takedown_requests() -> list:
    records = []
    for i, c in enumerate(campaigns):
        offset = c.get("canary_trigger_offset", c["cam_offset"] + 60) + 1.0
        reg_name, reg_abuse = c["registrar"]
        meity = random.choice([True, False])
        rec = {
            "log_type": "TAKEDOWN_REQUEST",
            "request_id": new_id("TDN", i + 10),
            "timestamp": ts(offset),
            "threat_id": c["threat_id"],
            "fake_domain": c["fake_dom"],
            "registrar": reg_name,
            "registrar_abuse_email": reg_abuse,
            "cert_in_notified": True,
            "meity_notified": meity,
            "evidence_bundle": {
                "screenshot": f"screens/{c['cert_id']}.png",
                "similarity_pct": c["sim_pct"],
                "canary_log": c.get("trigger_id", "TRIG-UNKNOWN"),
                "cert_issuance": ts(c["cam_offset"] - random.uniform(5, 15)),
                "levenshtein_score": c["lev"],
                "tfidf_score": c["tfidf"],
            },
            "status": random.choice([
                "PENDING_REGISTRAR_RESPONSE",
                "TAKEDOWN_CONFIRMED",
                "ESCALATED_TO_CERT_IN",
                "DOMAIN_SUSPENDED",
            ]),
            "citizen_advisory_published": random.choice([True, False]),
        }
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# 14. ALERT — WEEKLY REPORT  ← FIXED: isocalendar()[1] not .week
# ════════════════════════════════════════════════════════════════

def gen_weekly_reports(n=3) -> list:
    records = []
    for i in range(n):
        week_start_offset = -(7 * i + 7) * 24 * 60
        rec = {
            "log_type": "WEEKLY_REPORT",
            "report_id": f"RPT-{BASE_TIME.year}-W{_ISO_WEEK - i:02d}",
            "generated_at": ts(-(i * 10080) + 6 * 60),
            "period_start": ts(week_start_offset),
            "period_end": ts(week_start_offset + 7 * 24 * 60 - 1),
            "summary": {
                "new_fake_domains": random.randint(3, 12),
                "campaigns_confirmed": random.randint(1, 4),
                "canaries_triggered": random.randint(1, 4),
                "takedowns_filed": random.randint(2, 9),
                "login_anomalies": random.randint(5, 20),
                "cross_zone_escalations": random.randint(0, 3),
                "zones_affected": random.sample(MCD_ZONES, k=random.randint(2, 5)),
                "highest_threat_level": random.choice(["CRITICAL", "HIGH"]),
            },
            "pdf_path": f"reports/SENTINEL-RPT-{BASE_TIME.year}-W{_ISO_WEEK - i:02d}.pdf",
            "distributed_to": ["ciso@mcd.gov.in", "commissioner@mcd.gov.in"],
            "trigger": "APSCHEDULER_CRON",
        }
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# 15. SYSTEM — API REQUEST LOGS
# ════════════════════════════════════════════════════════════════

API_ENDPOINTS = [
    ("GET",  "/api/v1/threats",              200),
    ("GET",  "/api/v1/threats/{id}",         200),
    ("GET",  "/api/v1/campaigns",            200),
    ("GET",  "/api/v1/dashboard/summary",    200),
    ("GET",  "/api/v1/zones/{zone}/anomalies", 200),
    ("POST", "/api/v1/takedown",             201),
    ("GET",  "/api/v1/canary/{id}/status",   200),
    ("GET",  "/api/v1/alerts",               200),
    ("GET",  "/api/v1/report/weekly",        200),
    ("GET",  "/api/v1/threats",              401),
    ("POST", "/api/v1/scan/trigger",         202),
]

def gen_api_requests(n=30) -> list:
    records = []
    for i in range(n):
        offset = random.uniform(0, 250)
        method, ep, status = random.choice(API_ENDPOINTS)
        ep = ep.replace("{id}", short_id("THR", random.randint(300, 310)))
        ep = ep.replace("{zone}", random.choice(MCD_ZONES))
        authed = status != 401
        rec = {
            "log_type": "API_REQUEST",
            "request_id": new_id("REQ", 99000 + i),
            "timestamp": ts(offset),
            "method": method,
            "endpoint": ep,
            "client_ip": random.choice(["10.0.0.5", "10.0.0.6", "10.0.0.10"]),
            "user_agent": random.choice([
                "SENTINEL-Dashboard/1.0",
                "Mozilla/5.0 (X11; Linux x86_64) SENTINEL-Admin",
                "python-httpx/0.24.1",
            ]),
            "status_code": status,
            "latency_ms": random.randint(5, 120),
            "response_size_bytes": random.randint(512, 8192),
            "authenticated": authed,
        }
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# 16. SYSTEM — SCHEDULER RUNS
# ════════════════════════════════════════════════════════════════

def gen_scheduler_runs(n=20) -> list:
    records = []
    for i in range(n):
        offset = i * 5.0
        rec = {
            "log_type": "SCHEDULER_RUN",
            "run_id": new_id("SCH", 400 + i),
            "timestamp": ts(offset),
            "job_name": "DRISHTI_SCAN",
            "trigger": "INTERVAL_5MIN",
            "duration_sec": round(random.uniform(12.0, 90.0), 1),
            "certs_checked": random.randint(800, 2500),
            "domains_flagged": random.randint(0, 5),
            "domains_confirmed": random.randint(0, 2),
            "status": random.choices(["COMPLETED", "COMPLETED", "ERROR"], weights=[18, 18, 1])[0],
            "error": None if random.random() > 0.05 else "certstream connection timeout",
        }
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# 17. SYSTEM — WEBSOCKET EVENTS
# ════════════════════════════════════════════════════════════════

def gen_websocket_events() -> list:
    records = []
    events = [
        ("THREAT_DETECTED",       "HIGH"),
        ("CAMPAIGN_CONFIRMED",    "CRITICAL"),
        ("CANARY_TRIGGERED",      "CRITICAL"),
        ("LOGIN_SPIKE",           "HIGH"),
        ("CROSS_ZONE_ESCALATION", "CRITICAL"),
        ("TAKEDOWN_FILED",        "INFO"),
        ("WEEKLY_REPORT_READY",   "INFO"),
        ("SYSTEM_HEARTBEAT",      "INFO"),
    ]
    for i, (ev_name, sev) in enumerate(events * 2):
        offset = random.uniform(5, 250)
        clients = random.randint(1, 5)
        rec = {
            "log_type": "WEBSOCKET_PUSH",
            "ws_event_id": new_id("WS", i + 400),
            "timestamp": ts(offset),
            "event_name": ev_name,
            "payload": {
                "campaign_id": random.choice([c.get("campaign_id", "CAM-UNKNOWN") for c in campaigns[:5]]),
                "severity": sev,
                "message": f"[{sev}] {ev_name.replace('_', ' ').title()} detected",
                "zone": random.choice(MCD_ZONES),
            },
            "connected_clients": clients,
            "delivered_to": clients,
        }
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# 18. SYSTEM — SYNTHETIC LOG GENERATION METADATA
# ════════════════════════════════════════════════════════════════

def gen_synthetic_meta() -> list:
    scenarios = [
        "FULL_CAMPAIGN_SIMULATION",
        "BRUTE_FORCE_ONLY",
        "BASELINE_TRAFFIC_ONLY",
        "CREDENTIAL_STUFFING_POST_PHISHING",
        "CROSS_ZONE_COORDINATED_ATTACK",
    ]
    records = []
    for i, scenario in enumerate(scenarios):
        rec = {
            "log_type": "SYNTHETIC_RUN",
            "run_id": new_id("SYN", i + 1),
            "timestamp": ts(-(i * 60 + 5)),
            "scenario": scenario,
            "seed": SEED + i,
            "zones": random.sample(MCD_ZONES, k=random.randint(3, 6)),
            "machines_simulated": 2400,
            "event_logs_generated": random.randint(20000, 60000),
            "attack_injected_at": ts(random.uniform(60, 120)) if "ATTACK" in scenario or "STUFFING" in scenario else None,
            "attack_type": scenario if scenario != "BASELINE_TRAFFIC_ONLY" else None,
            "output_file": f"data/synthetic_mcd_{scenario.lower()}.evtx.json",
            "status": "COMPLETE",
        }
        records.append(rec)
    return records

# ════════════════════════════════════════════════════════════════
# MAIN — GENERATE EVERYTHING
# ════════════════════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("  SENTINEL Synthetic Log Generator")
    print(f"  Output: {OUTPUT_DIR.resolve()}")
    print("=" * 60)

    all_records = []

    tasks = [
        ("certstream_events.jsonl",    gen_certstream_events),
        ("dnstwist_scans.jsonl",        gen_dnstwist_scans),
        ("screenshot_analysis.jsonl",   gen_screenshot_analysis),
        ("domain_threats.jsonl",        gen_domain_threats),
        ("canary_planted.jsonl",        gen_canary_planted),
        ("windows_events_raw.jsonl",    gen_windows_events),
        ("zscore_anomalies.jsonl",      gen_zscore_anomalies),
        ("pattern_detections.jsonl",    gen_pattern_detections),
        ("cross_zone_anomalies.jsonl",  gen_cross_zone_anomalies),
        ("canary_triggered.jsonl",      gen_canary_triggered),
        ("campaign_correlations.jsonl", gen_campaign_correlations),
        ("alerts_dispatched.jsonl",     gen_alert_dispatched),
        ("takedown_requests.jsonl",     gen_takedown_requests),
        ("weekly_reports.jsonl",        gen_weekly_reports),
        ("api_requests.jsonl",          gen_api_requests),
        ("scheduler_runs.jsonl",        gen_scheduler_runs),
        ("websocket_events.jsonl",      gen_websocket_events),
        ("synthetic_meta.jsonl",        gen_synthetic_meta),
    ]

    total = 0
    for filename, generator in tasks:
        records = generator()
        write_jsonl(filename, records)
        print(f"  ✓  {filename:<40} {len(records):>4} records")
        all_records.extend(records)
        total += len(records)

    all_records.sort(key=lambda r: r.get("timestamp", ""))
    write_jsonl("ALL_SENTINEL_LOGS.jsonl", all_records)

    log_type_counts = {}
    for r in all_records:
        lt = r.get("log_type", "UNKNOWN")
        log_type_counts[lt] = log_type_counts.get(lt, 0) + 1

    summary = {
        "generator": "SENTINEL Synthetic Log Generator",
        "seed": SEED,
        "base_time": BASE_TIME.isoformat(),
        "total_records": total,
        "total_campaigns_simulated": len(campaigns),
        "log_type_breakdown": log_type_counts,
        "files_written": [t[0] for t in tasks] + ["ALL_SENTINEL_LOGS.jsonl"],
    }

    with open(OUTPUT_DIR / "SUMMARY.json", "w") as f:
        json.dump(summary, f, indent=2)

    print()
    print(f"  ══ Total records generated : {total}")
    print(f"  ══ Campaigns simulated     : {len(campaigns)}")
    print(f"  ══ Merged file             : logs/ALL_SENTINEL_LOGS.jsonl")
    print(f"  ══ Summary                 : logs/SUMMARY.json")
    print()
    print("  Cross-linked ID chains:")
    for c in campaigns[:3]:
        print(f"    {c['cert_id']} → {c['threat_id']} → {c['canary_id'][:28]}... → {c.get('campaign_id','?')}")
    print("=" * 60)

if __name__ == "__main__":
    main()
