"""
SENTINEL — Attack Simulation Route
POST /api/simulation/run  → run a full scripted attack scenario
                            This pushes real events into the DB and
                            broadcasts them over WebSocket in real-time.
"""

from fastapi import APIRouter, BackgroundTasks
from datetime import datetime
import asyncio
import uuid

from app.database import get_conn
from app.websocket_manager import manager
from app.modules.drishti_engine import analyze_domain
from app.modules.kavach_engine import analyze_login_spike, analyze_ip
from app.modules.bridge_engine import run_correlation_engine

router = APIRouter()

SIM_RUNNING = {"active": False}


async def run_simulation_background():
    """
    Full end-to-end attack simulation — writes real DB entries,
    broadcasts real WebSocket events at timed intervals.
    """
    SIM_RUNNING["active"] = True
    sim_domain_id = f"SIM-{str(uuid.uuid4())[:6].upper()}"
    sim_event_id  = f"KV-SIM-{str(uuid.uuid4())[:6].upper()}"

    steps = [
        (0,    "DRISHTI",  "INFO",     "CertStream alert: new SSL cert issued for mcd-verify-aadhaar.xyz"),
        (2,    "DRISHTI",  "MEDIUM",   "WHOIS lookup: domain registered 3 hours ago via privacy proxy"),
        (4,    "DRISHTI",  "HIGH",     "Levenshtein distance 2 from mcd.delhi.gov.in — TYPOSQUAT CONFIRMED"),
        (6,    "DRISHTI",  "CRITICAL", "Visual hash match 91% — Aadhaar form + payment fields detected on clone portal"),
        (8,    "CANARY",   "INFO",     "Canary credential 'priya.sharma.7731' injected into fake portal"),
        (11,   "KAVACH",   "HIGH",     "Login anomaly — Central Zone: 47 failed attempts in 90 seconds (Z-score: 4.1)"),
        (13,   "KAVACH",   "CRITICAL", "Foreign IP 185.220.101.47 (known Tor exit node) attempting privileged access"),
        (15,   "BRIDGE",   "HIGH",     "Correlation engine: portal type MATCH + timing MATCH (Δt = 2h 14min)"),
        (17,   "BRIDGE",   "CRITICAL", "⚡ UNIFIED ATTACK NARRATIVE — Confidence: 96% — Phishing → Credential Stuffing CONFIRMED"),
        (19,   "CANARY",   "CRITICAL", "Canary 'priya.sharma.7731' used on real MCD portal from IP 185.220.101.47 — THEFT PROVEN"),
        (21,   "SYSTEM",   "INFO",     "CERT-IN takedown request auto-generated. All 40 IT staff alerted via email."),
    ]

    conn = get_conn()

    # Step 1: Insert the fake phishing domain
    await asyncio.sleep(1)
    conn.execute(
        """INSERT OR IGNORE INTO phishing_domains
           (id,domain,similarity,threat_type,status,severity,indicators,age_minutes)
           VALUES (?,?,?,?,?,?,?,?)""",
        (sim_domain_id, "mcd-verify-aadhaar.xyz", 91, "Aadhaar Form",
         "LIVE", "CRITICAL", "['Levenshtein distance 2','Aadhaar form detected','SSL cert < 3h old']", 0)
    )
    conn.commit()

    for delay_sec, actor, severity, message in steps:
        await asyncio.sleep(2)  # 2s between each step for dramatic effect

        # Broadcast the log event
        await manager.broadcast("sim_step", {
            "actor": actor,
            "severity": severity,
            "message": message,
            "ts": datetime.now().strftime("%H:%M:%S"),
        })

        # At step 6 — insert KAVACH event
        if "Login anomaly" in message:
            conn.execute(
                """INSERT OR IGNORE INTO security_events
                   (id,event_type,zone,severity,details,source_ip)
                   VALUES (?,?,?,?,?,?)""",
                (sim_event_id, "failed_login", "Central", "CRITICAL",
                 "47 failed logins in 90s — Z-score 4.1 [SIM]", "185.220.101.47")
            )
            conn.execute(
                "UPDATE zone_stats SET event_count=event_count+1, threat_level='CRITICAL' WHERE zone='Central'"
            )
            conn.commit()

        # At step 8 — run BRIDGE
        if "BRIDGE" in actor and "CONFIRMED" in message:
            domains = [dict(r) for r in conn.execute(
                "SELECT * FROM phishing_domains WHERE id=?", (sim_domain_id,)
            ).fetchall()]
            events = [dict(r) for r in conn.execute(
                "SELECT * FROM security_events WHERE id=?", (sim_event_id,)
            ).fetchall()]
            if domains and events:
                from app.modules.bridge_engine import correlate
                corr = correlate(domains[0], events[0])
                if corr:
                    conn.execute(
                        """INSERT OR IGNORE INTO correlations
                           (id,domain_id,event_id,confidence,correlation_type,
                            portal_match,timing_match,pattern_match,confirmed,narrative)
                           VALUES (?,?,?,?,?,?,?,?,?,?)""",
                        (corr["id"], corr["domain_id"], corr["event_id"],
                         96, "Credential Stuffing", 1, 1, 1, 1,
                         "SIMULATION: External phishing → internal login spike CONFIRMED")
                    )
                    conn.commit()

        # Broadcast zone update after KAVACH event
        if "Central Zone" in message:
            await manager.broadcast("zone_update", {
                "zone": "Central",
                "threat_level": "CRITICAL",
                "event_count": 3,
            })

    conn.close()
    SIM_RUNNING["active"] = False
    await manager.broadcast("sim_complete", {
        "message": "Simulation complete — all events logged to database",
        "severity": "INFO",
    })


@router.post("/run")
async def run_simulation(background_tasks: BackgroundTasks):
    if SIM_RUNNING["active"]:
        return {"status": "already_running", "message": "Simulation is already in progress"}

    background_tasks.add_task(run_simulation_background)
    return {
        "status": "started",
        "message": "Attack simulation started — connect to WebSocket ws://localhost:8000/ws for live updates",
        "websocket": "ws://localhost:8000/ws",
    }


@router.get("/status")
def sim_status():
    return {"active": SIM_RUNNING["active"]}
