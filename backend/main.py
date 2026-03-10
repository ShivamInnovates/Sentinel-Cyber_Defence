"""
SENTINEL — Unified Cyber Defense for MCD
Main FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from app.database import init_db, seed_db
from app.routes import drishti, kavach, bridge, simulation, websocket_router
from app.scheduler import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🟢 SENTINEL starting up...")
    init_db()
    seed_db()
    scheduler = start_scheduler()
    print("🟢 Database initialized")
    print("🟢 Background scheduler started")
    print("🟢 SENTINEL is LIVE — http://localhost:8000")
    yield
    # Shutdown
    scheduler.shutdown()
    print("🔴 SENTINEL shutting down")


app = FastAPI(
    title="SENTINEL API",
    description="Unified Cyber Defense System for Municipal Corporation of Delhi",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow the React frontend on any port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(drishti.router,    prefix="/api/drishti",    tags=["DRISHTI"])
app.include_router(kavach.router,     prefix="/api/kavach",     tags=["KAVACH"])
app.include_router(bridge.router,     prefix="/api/bridge",     tags=["BRIDGE"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["Simulation"])
app.include_router(websocket_router.router, tags=["WebSocket"])


@app.get("/")
def root():
    return {
        "system": "SENTINEL",
        "version": "2.0.0",
        "status": "OPERATIONAL",
        "modules": ["DRISHTI", "KAVACH", "BRIDGE"],
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "system": "SENTINEL"}
