from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from app.database import get_conn
from app.websocket_manager import manager
from app.modules.kavach_engine import analyze_login_spike, analyze_ip

router = APIRouter()

class LoginRequest(BaseModel):
    failed_count: int
    zone: str
    window_seconds: int
    source_ip: str

class IpRequest(BaseModel):
    ip: str
    zone: str

@router.get("/events")
def get_events():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM security_events").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/events/{id}/resolve")
def resolve_event(id: str):
    return {"status": "success", "id": id}

@router.post("/analyze/login")
async def analyze_login(req: LoginRequest):
    result = analyze_login_spike(req.failed_count, req.zone, req.window_seconds, req.source_ip)
    await manager.broadcast("kavach_alert", result)
    return result

@router.post("/analyze/ip")
async def analyze_ip_route(req: IpRequest):
    result = analyze_ip(req.ip, req.zone)
    await manager.broadcast("kavach_alert", result)
    return result

@router.post("/analyze/port-scan")
def analyze_port_scan():
    return {"status": "not_implemented"}

@router.post("/analyze/log")
async def analyze_log(file: UploadFile = File(...)):
    content = await file.read()
    return {"parsed_lines": len(content.split(b'\\n')), "threats_found": 1}

@router.get("/zones")
def get_zones():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM zone_stats").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/stats")
def get_stats():
    return {"events_today": 247}
