import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio

# import your models
from Models.models import score_domain, run_bridge
from Models.demo import deep_analysis_pipeline, run_automated_demo, get_sim_log, get_sim_state
import json
import threading
from datetime import datetime

app = FastAPI()

# 🔥 VERY IMPORTANT (frontend connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# TEST ROUTE
# -----------------------------
@app.get("/")
def home():
    return {"message": "Sentinel backend running 🚀"}


# -----------------------------
# MODEL 1 API
# -----------------------------
@app.get("/scan-domain")
def scan_domain(domain: str):
    return score_domain(domain)


# -----------------------------
# FULL PIPELINE (MODEL 1 → 5)
# -----------------------------
@app.get("/analyze")
def analyze(domain: str):
    result = asyncio.run(
        deep_analysis_pipeline(domain, "property_tax")
    )
    return result

# -----------------------------
# FRONTEND API ENDPOINTS
# -----------------------------
@app.get("/api/domains")
def get_domains():
    if os.path.exists("data/fake_sites.json"):
        return json.load(open("data/fake_sites.json"))
    return []

@app.get("/api/events")
def get_events():
    if os.path.exists("data/kavach_alerts.json"):
        return json.load(open("data/kavach_alerts.json"))
    return []

@app.get("/api/correlations")
def get_correlations():
    return run_bridge()

@app.get("/api/canaries")
def get_canaries():
    if os.path.exists("data/canaries.json"):
        return json.load(open("data/canaries.json"))
    return []

@app.get("/api/kpi")
def get_kpi():
    domains = get_domains()
    events = get_events()
    corrs = get_correlations()
    return {
        "activeThreats": len([d for d in domains if d.get("status", "LIVE") != "TAKEDOWN"]),
        "criticalCount": len([e for e in events if e.get("severity") == "RED"]) + len(corrs),
        "livePhishingSites": len([d for d in domains if d.get("classification") in ("CONFIRMED", "PROBABLE")]),
        "loginAnomalies": len([e for e in events if e.get("rule") == "LOGIN_SPIKE"]),
        "bridgeCorrelations": len(corrs),
        "domainsMonitored": 18447,
        "computersCovered": 2400,
        "avgDetectionMins": 3.8,
        "zonesProtected": 12,
        "takedownsSent": len([d for d in domains if d.get("status") == "TAKEDOWN"])
    }

@app.post("/api/simulate")
def start_simulation():
    thread = threading.Thread(target=run_automated_demo)
    thread.daemon = True
    thread.start()
    return {"status": "started"}

@app.get("/api/sim-log")
def get_simulation_log():
    """Returns real step events emitted by the backend simulation."""
    return {"steps": get_sim_log(), "state": get_sim_state()}

@app.post("/api/classify-report")
def classify_report_api(body: dict):
    """Model 3: classify a phishing report text into a campaign."""
    from Models.models import classify_report, check_velocity, fit_model
    text = body.get("text", "")
    if not text:
        return {"error": "No text provided"}
    fit_model()
    result = classify_report(text, report_id=int(datetime.now().timestamp()))
    velocity = check_velocity(result["campaign_id"]) if result.get("campaign_id") else {}
    return {**result, "velocity": velocity}

@app.post("/api/scan-domain")
def scan_domain_post(body: dict):
    """Model 1: score a domain for phishing risk (POST form)."""
    domain = body.get("domain", "")
    if not domain:
        return {"error": "No domain provided"}
    return score_domain(domain)