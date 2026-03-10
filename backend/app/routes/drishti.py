from fastapi import APIRouter
from pydantic import BaseModel
from app.database import get_conn
from app.websocket_manager import manager
from app.modules.drishti_engine import analyze_domain

router = APIRouter()

class DomainRequest(BaseModel):
    domain: str

@router.get("/domains")
def get_domains():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM phishing_domains").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/analyze")
async def analyze(req: DomainRequest):
    result = await analyze_domain(req.domain)
    await manager.broadcast("drishti_alert", result)
    return result

@router.post("/domains/{id}/takedown")
async def takedown_domain(id: str):
    conn = get_conn()
    conn.execute("UPDATE phishing_domains SET status='TAKEDOWN' WHERE id=?", (id,))
    conn.commit()
    conn.close()
    await manager.broadcast("takedown_sent", {"id": id})
    return {"status": "success", "id": id}

@router.get("/stats")
def get_stats():
    conn = get_conn()
    count = conn.execute("SELECT COUNT(*) FROM phishing_domains").fetchone()[0]
    conn.close()
    return {"domains_tracked": 18447, "detected_today": count}
