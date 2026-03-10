from fastapi import APIRouter
from app.database import get_conn
from app.websocket_manager import manager
from app.modules.bridge_engine import run_correlation_engine

router = APIRouter()

@router.get("/correlations")
def get_correlations():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM correlations").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/run")
async def run_bridge():
    conn = get_conn()
    domains = [dict(r) for r in conn.execute("SELECT * FROM phishing_domains").fetchall()]
    events = [dict(r) for r in conn.execute("SELECT * FROM security_events").fetchall()]
    conn.close()
    results = run_correlation_engine(domains, events)
    for res in results:
        await manager.broadcast("bridge_correlation", res)
    return {"correlations_found": len(results), "results": results}

@router.get("/canary")
def get_canary():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM canary_tokens").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/canary/deploy")
def deploy_canary(domain_id: str):
    return {"status": "deployed", "domain_id": domain_id}

@router.post("/canary/{id}/trigger")
async def trigger_canary(id: str):
    await manager.broadcast("canary_triggered", {"id": id, "severity": "CRITICAL"})
    return {"status": "triggered", "id": id}

@router.get("/stats")
def get_stats():
    return {"correlations": 3}
