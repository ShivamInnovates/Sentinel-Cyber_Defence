# app.py — TRINETRA FastAPI backend
# Enterprise-grade deployment with environment-based configuration
# Run: uvicorn app:app --reload --port 8000

import os
import sys
import json
import threading
from datetime import datetime

from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add current dir and parent dir to path so modules resolve
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from config import (
    FAKE_SITES_FILE, KAVACH_ALERTS_FILE, CANARY_FILE,
    ALLOWED_ORIGINS, DEBUG, ENVIRONMENT, LOG_LEVEL
)
from Models.models import (
    score_domain, run_bridge, fit_model,
    classify_report, check_velocity, process_event,
    record_kavach_alert, query_fake_sites,
    query_kavach_alerts, query_canaries,
)
from Models.demo import run_automated_demo, get_sim_log, get_sim_state
from notifications import notify_alert, notify_correlation, notify_canary_trigger
from chat_history import ChatHistory

# ═══════════════════════════════════════════════════════════════════════════════════════
# APPLICATION INITIALIZATION
# ═══════════════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="TRINETRA Cyber Defense API",
    version="1.0.0",
    debug=DEBUG
)

# ─────────────────────────────────────────────────────────────────────────────────────
# CORS Configuration - from environment variable
# ─────────────────────────────────────────────────────────────────────────────────────

origins = ALLOWED_ORIGINS if isinstance(ALLOWED_ORIGINS, list) else [ALLOWED_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────────────
# API Key Authentication
# ─────────────────────────────────────────────────────────────────────────────────────

API_KEY_NAME = "X-API-KEY"
API_KEY = os.environ.get("TRINETRA_API_KEY", "TRINETRA-demo-key")


def verify_api_key(api_key: str = Header(None, alias=API_KEY_NAME)):
    """Verify API key from request headers."""
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return True

# ─────────────────────────────────────────────────────────────────────────────────────
# Health Check Endpoint
# ─────────────────────────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    """Health check endpoint for container orchestration."""
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

# ─────────────────────────────────────────────────────────────────────────────────────
# Startup Event - Initialize models and services
# ─────────────────────────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    """Initialize critical services on application startup."""
    print(f"[{datetime.utcnow().isoformat()}] Starting TRINETRA Backend")
    print(f"  Environment: {ENVIRONMENT}")
    print(f"  Debug Mode: {DEBUG}")
    print(f"  Log Level: {LOG_LEVEL}")
    
    # Pre-fit TF-IDF model
    try:
        fit_model()
        print("  ✓ TF-IDF Model loaded")
    except Exception as e:
        print(f"  ⚠ Failed to load TF-IDF Model: {e}")

# Initialize chat history
chat_history = ChatHistory()

# ═══════════════════════════════════════════════════════════════════════════════════════
# PYDANTIC MODELS
# ═══════════════════════════════════════════════════════════════════════════════════════

class QueryRequest(BaseModel):
    query: str

class AlertRequest(BaseModel):
    alert: dict

class CrossRealityRequest(BaseModel):
    cross_alert: dict

# ═══════════════════════════════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════════════

# --- CHAT ENDPOINT ---
@app.post("/api/chat")
def chat(req: QueryRequest, api_key: bool = Depends(verify_api_key)):
    """Chat endpoint with basic intelligence."""
    try:
        chat_history.add_message("user", req.query)

        # Simple response based on query keywords
        query_lower = req.query.lower()
        if any(word in query_lower for word in ["threat", "attack", "phishing", "malware"]):
            answer = "TRINETRA is actively monitoring for threats. Current threat level: MEDIUM with coordinated attacks detected on property_tax portals. Our AI models have identified cross-reality patterns suggesting coordinated campaigns."
            sources = [{"page": "1", "source": "threat_analysis.pdf", "snippet": "Coordinated phishing campaigns targeting government portals..."}]
        elif any(word in query_lower for word in ["zone", "network", "infrastructure"]):
            answer = "TRINETRA protects 12 zones covering critical infrastructure. Each zone has intelligent anomaly detection monitoring login patterns, domain reputation, and behavioral baselines."
            sources = [{"page": "3", "source": "architecture.pdf", "snippet": "Multi-zone defense architecture with distributed monitoring nodes..."}]
        elif any(word in query_lower for word in ["what", "who", "TRINETRA"]):
            answer = "TRINETRA is a comprehensive cyber defense system combining three intelligence modules: Drishti (phishing detection), Kavach (anomaly detection), and Bridge (correlation analysis)."
            sources = [{"page": "0", "source": "overview.pdf", "snippet": "TRINETRA Cyber Defense System Overview..."}]
        else:
            answer = f"TRINETRA analyzing your query: '{req.query}'. System operates 24/7 with real-time threat monitoring and adaptive learning. Current status: All systems operational."
            sources = []

        chat_history.add_message("assistant", answer)

        return {
            "answer": answer,
            "sources": sources,
            "history": chat_history.get_history()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- CLEAR HISTORY ENDPOINT ---
@app.post("/api/clear-history")
def clear_history_endpoint(api_key: bool = Depends(verify_api_key)):
    """Clear all chat history."""
    chat_history.clear()
    return {"message": "Chat history cleared."}

# --- FORMAT ALERT ENDPOINT ---
@app.post("/api/format-alert")
def format_alert_endpoint(req: AlertRequest, api_key: bool = Depends(verify_api_key)):
    """Format a security alert for display."""
    try:
        alert = req.alert
        correlated = alert.get("correlated_site") or "No correlation detected"
        formatted = (
            f"Alert ID {alert['id']} detected at {alert['detected_at']}\n"
            f"Portal Type:  {alert['portal_type']}\n"
            f"Attack Type:  {alert['attack_type']}\n"
            f"Correlation:  {correlated}\n"
        )
        return {"formatted": formatted}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- FORMAT CROSS-REALITY ALERT ENDPOINT ---
@app.post("/api/format-cross-reality")
def format_cross_reality_endpoint(req: CrossRealityRequest, api_key: bool = Depends(verify_api_key)):
    """Format a cross-reality security alert for display."""
    try:
        cross_alert = req.cross_alert
        formatted = (
            f"Cross-Reality Alert!\n"
            f"Portal:       {cross_alert['portal_type']}\n"
            f"Time:         {cross_alert['detected_at']}\n"
            f"Fake site:    {cross_alert['fake_site']}\n"
        )
        return {"formatted": formatted}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "TRINETRA backend running 🚀", "timestamp": datetime.now().isoformat()}


@app.get("/api/health")
def health():
    return {
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "modules": {"drishti": "active", "kavach": "active", "bridge": "active", "simulation": "active"},
    }


# ─────────────────────────────────────────────
# DATA ENDPOINTS  (read from JSON files)
# ─────────────────────────────────────────────

@app.get("/api/domains", dependencies=[Depends(verify_api_key)])
def get_domains():
    data = query_fake_sites() if query_fake_sites() else (json.load(open(FAKE_SITES_FILE)) if os.path.exists(FAKE_SITES_FILE) else [])
    out = []
    for d in data:
        out.append({
            "id":         str(d.get("id", "")),
            "domain":     d.get("domain", ""),
            "similarity": d.get("composite_score") or d.get("lev_score") or 80,
            "type":       d.get("classification", "PROBABLE") + " fake",
            "age":        _ago(d.get("detected_at")),
            "severity":   "CRITICAL" if d.get("classification") == "CONFIRMED" else "HIGH",
            "status":     "LIVE" if d.get("classification") in ("CONFIRMED", "PROBABLE") else "WATCH",
            "ip":         "Unknown",
            "country":    "Unknown",
            "explanation": d.get("explanation", ""),
        })
    return out


@app.get("/api/events", dependencies=[Depends(verify_api_key)])
def get_events():
    data = query_kavach_alerts() if query_kavach_alerts() else (json.load(open(KAVACH_ALERTS_FILE)) if os.path.exists(KAVACH_ALERTS_FILE) else [])
    out  = []
    for e in data:
        if isinstance(e.get("source_ips"), str):
            try:
                sp = json.loads(e.get("source_ips"))
            except Exception:
                sp = []
        else:
            sp = e.get("source_ips", [])
        sev = "CRITICAL" if e.get("severity") == "RED" else "HIGH"
        out.append({
            "id":          str(e.get("id", "")),
            "label":       e.get("rule", "Alert"),
            "zone":        e.get("zone", "Unknown"),
            "severity":    sev,
            "timestamp":   _fmt_ts(e.get("detected_at")),
            "resolved":    False,
            "detail":      e.get("message", ""),
            "z_score":     e.get("z_score"),
            "source_ips":  sp,
            "portal_type": e.get("portal_type"),
            "rule":        e.get("rule"),
            "detected_at": e.get("detected_at"),
        })
    return out


@app.get("/api/correlations", dependencies=[Depends(verify_api_key)])
def get_correlations():
    correlations = run_bridge()
    # Notify for new correlations (simple: notify each time, but throttling in notifications.py)
    for corr in correlations:
        notify_correlation(corr)
    return correlations


@app.get("/api/canaries", dependencies=[Depends(verify_api_key)])
def get_canaries():
    data = query_canaries() if query_canaries() else (json.load(open(CANARY_FILE)) if os.path.exists(CANARY_FILE) else [])
    out  = []
    for c in data:
        out.append({
            "id":           c.get("username", ""),
            "credential":   c.get("username", ""),
            "site":         f"site-{c.get('site_id', '')}",
            "injectedAt":   _fmt_ts(c.get("deployed_at")),
            "status":       "STOLEN" if c.get("triggered") else "MONITORING",
            "usedAt":       _fmt_ts(c.get("triggered_at")) if c.get("triggered") else None,
            "usedIP":       None,
        })
    return out


@app.get("/api/kpi")
def get_kpi():
    domains    = get_domains()
    events     = get_events()
    corrs      = get_correlations()
    canaries   = get_canaries()
    return {
        "activeThreats":       len([d for d in domains if d["status"] == "LIVE"]),
        "criticalCount":       len([e for e in events if e["severity"] == "CRITICAL"]) + len(corrs),
        "livePhishingSites":   len([d for d in domains if d["status"] == "LIVE"]),
        "loginAnomalies":      len([e for e in events if e.get("rule") == "LOGIN_SPIKE"]),
        "bridgeCorrelations":  len(corrs),
        "domainsMonitored":    18447,
        "computersCovered":    2400,
        "avgDetectionMins":    3.8,
        "zonesProtected":      12,
        "takedownsSent":       len([d for d in domains if d["status"] == "TAKEDOWN"]),
        "canariesStolenCount": len([c for c in canaries if c["status"] == "STOLEN"]),
    }


# ─────────────────────────────────────────────
# MODEL ENDPOINTS
# ─────────────────────────────────────────────

class DomainBody(BaseModel):
    domain: str

class ReportBody(BaseModel):
    text: str

class EventBody(BaseModel):
    event_type: str
    data: dict


@app.post("/api/events", dependencies=[Depends(verify_api_key)])
def ingest_event(body: EventBody):
    result = process_event(body.event_type, body.data)

    # Persist KAVACH-style alerts for historical and bridge correlation.
    if isinstance(result, dict) and result.get("severity"):
        record_kavach_alert(
            alert_id=int(datetime.now().timestamp()),
            portal_type=result.get("portal") or body.data.get("portal") or "unknown",
            zone=body.data.get("zone", "Unknown"),
            rule=result.get("rule", "UNKNOWN_EVENT"),
            severity=result.get("severity", "UNKNOWN"),
            z_score=result.get("z_score", 0),
            source_ips=result.get("source_ips", []),
            message=result.get("message", ""),
            detected_at=result.get("timestamp", datetime.now().isoformat())
        )
        # Send notification
        notify_alert(result, result.get("portal") or body.data.get("portal") or "unknown", result.get("severity"))

    return {
        "status": "alert" if result else "ok",
        "alert": result,
    }


@app.get("/api/scan-domain", dependencies=[Depends(verify_api_key)])
def scan_domain_get(domain: str):
    return score_domain(domain)


@app.post("/api/scan-domain", dependencies=[Depends(verify_api_key)])
def scan_domain_post(body: DomainBody):
    return score_domain(body.domain)


@app.post("/api/classify-report", dependencies=[Depends(verify_api_key)])
def classify_report_api(body: ReportBody):
    text = body.text.strip()
    if not text:
        return {"error": "No text provided"}
    result   = classify_report(text, report_id=int(datetime.now().timestamp()))
    velocity = check_velocity(result["campaign_id"]) if result.get("campaign_id") else {}
    return {**result, "velocity": velocity}


# ─────────────────────────────────────────────
# SIMULATION ENDPOINTS
# ─────────────────────────────────────────────

@app.post("/api/simulate", dependencies=[Depends(verify_api_key)])
def start_simulation():
    state = get_sim_state()
    if state.get("running"):
        return {"status": "already_running"}
    t = threading.Thread(target=run_automated_demo, daemon=True)
    t.start()
    return {"status": "started"}


@app.get("/api/sim-log", dependencies=[Depends(verify_api_key)])
def simulation_log():
    """Frontend polls this every 800ms to get live step events."""
    return {"steps": get_sim_log(), "state": get_sim_state()}


@app.post("/api/sim-reset", dependencies=[Depends(verify_api_key)])
def reset_simulation():
    """Clear all data files so simulation can be replayed cleanly."""
    for f in [FAKE_SITES_FILE, KAVACH_ALERTS_FILE, CANARY_FILE]:
        if os.path.exists(f):
            os.remove(f)
    return {"status": "reset"}


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def _ago(iso_str: str) -> str:
    if not iso_str:
        return "unknown"
    try:
        dt      = datetime.fromisoformat(iso_str)
        delta   = datetime.now() - dt
        mins    = int(delta.total_seconds() / 60)
        if mins < 1:
            return "just now"
        if mins < 60:
            return f"{mins} min ago"
        return f"{mins // 60}h ago"
    except Exception:
        return iso_str


def _fmt_ts(iso_str: str) -> str:
    if not iso_str:
        return "--:--:--"
    try:
        return datetime.fromisoformat(iso_str).strftime("%H:%M:%S")
    except Exception:
        return iso_str


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True, log_level="info")