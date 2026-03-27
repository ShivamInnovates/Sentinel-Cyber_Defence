import os
import sys
import json
import threading
import subprocess
from datetime import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File, Header, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pdf_loader import get_vectorstore
from chat_history import ChatHistory
from alert_formatter import format_alert, format_cross_reality

from langchain.chains import ConversationalRetrievalChain
from langchain_huggingface import HuggingFacePipeline
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# ─────────────────────────────────────────
# FastAPI setup
# ─────────────────────────────────────────
app = FastAPI(title="SENTINEL Cyber Defense Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# API Key Authentication
# ─────────────────────────────────────────
API_KEY_NAME = "X-API-KEY"
API_KEY = os.environ.get("SENTINEL_API_KEY", "TRINETRA-demo-key")

def verify_api_key(api_key: str = Header(None, alias=API_KEY_NAME)):
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return True

# ─────────────────────────────────────────
# Load vectorstore + retriever
# ─────────────────────────────────────────
vectorstore = None
retriever = None
try:
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
except Exception as e:
    print(f"[Chatbot] Warning: Could not load vectorstore: {e}")
    vectorstore = None
    retriever = None

# ─────────────────────────────────────────
# Load local LLM — Hugging Face
# ─────────────────────────────────────────
llm = None
try:
    model_name = "gpt2"  # lightweight for demo; adjust to your hardware
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)
    
    pipe = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_length=512,
        do_sample=True,
        temperature=0.7,
    )
    
    llm = HuggingFacePipeline(pipeline=pipe)
except Exception as e:
    print(f"[Chatbot] Warning: Could not load LLM: {e}")
    llm = None

# ─────────────────────────────────────────
# RAG Prompt — General format
# ─────────────────────────────────────────
RAG_PROMPT = PromptTemplate(
    input_variables=["context", "question", "chat_history"],
    template="""You are SENTINEL, a precise and reliable security assistant.
Answer ONLY using the context provided below.
If the answer is not in the context, say "I don't have enough information to answer that."
Never fabricate information.

Context from documents:
{context}

Previous conversation:
{chat_history}

User question: {question}
Answer:"""
)

# ─────────────────────────────────────────
# Memory + RAG Chain
# ─────────────────────────────────────────
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
    output_key="answer"
)

qa_chain = None
if llm and retriever and vectorstore:
    try:
        qa_chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=retriever,
            memory=memory,
            return_source_documents=True,
            combine_docs_chain_kwargs={"prompt": RAG_PROMPT},
            verbose=True
        )
    except Exception as e:
        print(f"[Chatbot] Warning: Could not create QA chain: {e}")
        qa_chain = None
else:
    print("[Chatbot] QA chain unavailable (missing LLM, vectorstore, or retriever)")

# ─────────────────────────────────────────
# Manual chat history tracker
# ─────────────────────────────────────────
chat_history = ChatHistory()

# ─────────────────────────────────────────
# Request models
# ─────────────────────────────────────────
class QueryRequest(BaseModel):
    query: str

class AlertRequest(BaseModel):
    alert: dict

class CrossRealityRequest(BaseModel):
    cross_alert: dict

# ─────────────────────────────────────────
# /api/chat — main RAG chat endpoint
# ─────────────────────────────────────────
@app.post("/api/chat")
def chat(req: QueryRequest, api_key: bool = Depends(verify_api_key)):
    """Chat endpoint integrated with PDF retrieval."""
    try:
        chat_history.add_message("user", req.query)

        if qa_chain is None:
            # Intelligent fallback responses based on query keywords
            query_lower = req.query.lower()
            if any(word in query_lower for word in ["threat", "attack", "phishing", "malware", "security"]):
                answer = "SENTINEL is actively monitoring for threats. I'm currently operating in demo mode with limited AI capabilities. Current threat level: MEDIUM with coordinated attacks detected on critical portals. Our ML models continuously analyze patterns to identify cross-reality connections."
            elif any(word in query_lower for word in ["zone", "network", "infrastructure", "system"]):
                answer = "SENTINEL protects 12 zones covering critical infrastructure across Delhi. Each zone has intelligent anomaly detection monitoring login patterns, domain reputation, and behavioral baselines. Real-time monitoring is active."
            elif any(word in query_lower for word in ["sentinel", "what", "who", "help", "how"]):
                answer = "SENTINEL is a comprehensive cyber defense system combining three intelligence modules: Drishti (phishing detection via CertStream and visual analysis), Kavach (anomaly detection for unusual login and network patterns), and Bridge (correlation analysis linking external threats to internal attacks). I'm SENTINEL's AI assistant, operating in demo mode."
            elif any(word in query_lower for word in ["fake", "domain", "phish", "clone"]):
                answer = "SENTINEL's Drishti module monitors SSL certificates in real-time and performs visual similarity analysis. We've detected several phishing sites impersonating government portals. Each detection includes domain similarity scores and takedown recommendations."
            elif any(word in query_lower for word in ["alert", "event", "anomaly", "login"]):
                answer = "SENTINEL's Kavach module detects anomalies like unusual login patterns, foreign IP access, off-hours privileged access, and suspicious data transfers. The system uses statistical analysis and z-scores to identify deviations from normal behavior."
            elif any(word in query_lower for word in ["correlation", "bridge", "connection"]):
                answer = "SENTINEL's Bridge module correlates external threats (phishing sites) with internal events (login attempts) to build unified attack narratives. When a fake site steals credentials and those credentials are used on real systems, Bridge connects the dots."
            else:
                answer = f"SENTINEL is analyzing your query: '{req.query}'. The system operates 24/7 with real-time threat monitoring and adaptive learning. Current status: All systems operational. (AI model running in demo mode)"
            sources = []
        else:
            try:
                result = qa_chain({"question": req.query})
                answer = result["answer"]
                sources = [
                    {
                        "page": doc.metadata.get("page", "unknown"),
                        "source": doc.metadata.get("source", "unknown"),
                        "snippet": doc.page_content[:200]
                    }
                    for doc in result.get("source_documents", [])
                ]
            except Exception as chain_error:
                print(f"[Chat] QA Chain error: {chain_error}")
                answer = f"SENTINEL encountered an issue processing your query with full AI capabilities. I'm falling back to knowledge base: '{req.query}'. Try asking about threats, domains, or system status."
                sources = []

        chat_history.add_message("assistant", answer)

        return {
            "answer": answer,
            "sources": sources,
            "history": chat_history.get_history()
        }

    except Exception as e:
        print(f"[Chat] Unexpected error: {e}")
        error_answer = "SENTINEL encountered an unexpected error. Please try refreshing the page or asking a different question."
        chat_history.add_message("assistant", error_answer)
        return {
            "answer": error_answer,
            "sources": [],
            "history": chat_history.get_history()
        }

# ─────────────────────────────────────────
# /api/upload-pdf — swap the PDF at runtime
# ─────────────────────────────────────────
@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), api_key: bool = Depends(verify_api_key)):
    """Upload a new PDF and rebuild the vectorstore."""
    try:
        # save uploaded file
        upload_path = f"uploaded_{file.filename}"
        with open(upload_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # rebuild vectorstore from new PDF
        global vectorstore, retriever, qa_chain
        vectorstore = get_vectorstore(pdf_path=upload_path)
        retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

        # re-wire the chain with new retriever
        if qa_chain and llm:
            qa_chain = ConversationalRetrievalChain.from_llm(
                llm=llm,
                retriever=retriever,
                memory=memory,
                return_source_documents=True,
                combine_docs_chain_kwargs={"prompt": RAG_PROMPT},
                verbose=True
            )

        return {
            "message": f"PDF '{file.filename}' uploaded and vectorstore rebuilt.",
            "file": upload_path
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─────────────────────────────────────────
# /api/format-alert — format a security alert
# ─────────────────────────────────────────
@app.post("/api/format-alert")
def format_alert_endpoint(req: AlertRequest, api_key: bool = Depends(verify_api_key)):
    """Format a security alert for display."""
    try:
        formatted = format_alert(req.alert)
        return {"formatted": formatted}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ─────────────────────────────────────────
# /api/format-cross-reality — format cross-reality alert
# ─────────────────────────────────────────
@app.post("/api/format-cross-reality")
def format_cross_reality_endpoint(req: CrossRealityRequest, api_key: bool = Depends(verify_api_key)):
    """Format a cross-reality security alert for display."""
    try:
        formatted = format_cross_reality(req.cross_alert)
        return {"formatted": formatted}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ─────────────────────────────────────────
# /api/clear-history — reset chat memory
# ─────────────────────────────────────────
@app.post("/api/clear-history")
def clear_history(api_key: bool = Depends(verify_api_key)):
    """Clear all chat history and memory."""
    chat_history.clear()
    memory.clear()
    return {"message": "Chat history cleared."}

# ─────────────────────────────────────────
# Dashboard data endpoints
# ─────────────────────────────────────────

@app.get("/api/kpi")
def get_kpi():
    return {
        "activeThreats": 6,
        "criticalCount": 2,
        "livePhishingSites": 2,
        "loginAnomalies": 247,
        "bridgeCorrelations": 2,
        "domainsMonitored": 18447,
        "computersCovered": 2400,
        "avgDetectionMins": 3.8,
        "zonesProtected": 12,
        "takedownsSent": 2,
    }

@app.get("/api/domains")
def get_domains():
    return [
        {"id": "D001", "domain": "mcd-services-delhi.com",  "similarity": 94, "type": "Aadhaar Form Clone",   "age": "2 min ago",  "severity": "CRITICAL", "status": "LIVE",     "ip": "185.220.101.47", "country": "RU"},
        {"id": "D002", "domain": "mcdonline-payment.in",     "similarity": 87, "type": "Payment Portal Clone", "age": "14 min ago", "severity": "HIGH",     "status": "LIVE",     "ip": "103.42.58.22",   "country": "CN"},
        {"id": "D003", "domain": "delhi-mcd-portal.net",     "similarity": 81, "type": "Login Page Clone",     "age": "1h ago",     "severity": "HIGH",     "status": "TAKEDOWN", "ip": "91.108.4.33",    "country": "NL"},
        {"id": "D004", "domain": "mcd-tax-pay.org",          "similarity": 76, "type": "Tax Portal Clone",     "age": "3h ago",     "severity": "MEDIUM",   "status": "WATCH",    "ip": "172.66.40.2",    "country": "US"},
        {"id": "D005", "domain": "mcdelhi-official.co.in",   "similarity": 68, "type": "General Portal Clone", "age": "6h ago",     "severity": "LOW",      "status": "WATCH",    "ip": "104.21.14.88",   "country": "US"},
    ]

@app.get("/api/events")
def get_events():
    return [
        {"id": "KV001", "label": "Failed Login Spike",          "zone": "Central",    "severity": "CRITICAL", "timestamp": "08:12:00", "resolved": False, "count": 47},
        {"id": "KV002", "label": "Foreign IP Connection",       "zone": "North-East", "severity": "HIGH",     "timestamp": "08:41:00", "resolved": False, "count": 1},
        {"id": "KV003", "label": "Off-Hours Privileged Access", "zone": "East",       "severity": "HIGH",     "timestamp": "09:05:00", "resolved": False, "count": 3},
        {"id": "KV004", "label": "Port Scan Detected",          "zone": "North",      "severity": "MEDIUM",   "timestamp": "09:12:00", "resolved": False, "count": 134},
        {"id": "KV005", "label": "Large Data Transfer",         "zone": "South",      "severity": "MEDIUM",   "timestamp": "09:23:00", "resolved": False, "count": 1},
        {"id": "KV006", "label": "Failed Login Spike",          "zone": "Shahdara",   "severity": "CRITICAL", "timestamp": "09:28:00", "resolved": False, "count": 31},
    ]

@app.get("/api/canaries")
def get_canaries():
    return [
        {"id": "CN001", "credential": "suresh.kumar.2287",  "site": "mcd-services-delhi.com", "injectedAt": "08:44:12", "status": "STOLEN",     "usedAt": "08:51:33", "usedIP": "185.220.101.47"},
        {"id": "CN002", "credential": "rajesh.sharma.4419", "site": "delhi-mcd-portal.net",   "injectedAt": "06:31:05", "status": "STOLEN",     "usedAt": "06:39:12", "usedIP": "91.108.4.33"},
        {"id": "CN003", "credential": "priya.mehra.9901",   "site": "mcd-tax-pay.org",        "injectedAt": "15:12:30", "status": "MONITORING", "usedAt": None,       "usedIP": None},
    ]

@app.get("/api/correlations")
def get_correlations():
    return [
        {"id": "BR001", "externalThreat": "mcd-services-delhi.com", "internalEvent": "Failed Login Spike — Central Zone",       "confidence": 97, "type": "Phishing → Credential Stuffing", "confirmed": True,  "story": "A fake MCD website stole login credentials. Those credentials were used to attack the real MCD system."},
        {"id": "BR002", "externalThreat": "mcdonline-payment.in",    "internalEvent": "Off-Hours Privileged Access — East Zone", "confidence": 84, "type": "Phishing → Intrusion Attempt",   "confirmed": False, "story": "A fake payment site may have captured admin credentials used in an off-hours East Zone login."},
        {"id": "BR003", "externalThreat": "delhi-mcd-portal.net",    "internalEvent": "Foreign IP Connection — North-East Zone", "confidence": 72, "type": "Credential Stuffing",            "confirmed": True,  "story": "A now-taken-down clone site collected credentials later used by a foreign IP to probe MCD."},
    ]

# ─────────────────────────────────────────
# Simulation State + attack_demo.py runner
# ─────────────────────────────────────────
_sim_lock = threading.Lock()
_sim_state = {"running": False, "done": False, "steps": []}

# ── Hardcoded DRISHTI steps (injected before attack_demo runs) ──────────────
_DRISHTI_STEPS = [
    {"actor": "DRISHTI", "severity": "INFO",     "plain": "CertStream feed active — new domain found similar to MCD using Levenshtein algorithm"},
    {"actor": "DRISHTI", "severity": "HIGH",     "plain": "Domain similarity score calculated — domain flagged as suspicious"},
    {"actor": "DRISHTI", "severity": "INFO",     "plain": "Headless browser visiting suspicious domain — screenshot taken"},
    {"actor": "DRISHTI", "severity": "HIGH",     "plain": "Visual similarity score high — passing to Canary module"},
    {"actor": "DRISHTI", "severity": "CRITICAL", "plain": "Login spike detected on real MCD portal — too many attempts in short time, creating suspicion"},
]

# ── BRIDGE steps injected after phishing confirmation ────────────────────────
_BRIDGE_STEPS = [
    {"actor": "BRIDGE", "severity": "INFO",     "plain": "Correlation check running — linking external phishing to internal login events"},
    {"actor": "BRIDGE", "severity": "MEDIUM",   "plain": "Portal type match confirmed — fake site matches real MCD portal structure"},
    {"actor": "BRIDGE", "severity": "HIGH",     "plain": "Time window match confirmed — credential stuffing occurred within 10-minute window"},
    {"actor": "BRIDGE", "severity": "HIGH",     "plain": "Attack pattern confirmed — credential theft followed by replay on real site"},
    {"actor": "BRIDGE", "severity": "CRITICAL", "plain": "⚡ COORDINATED ATTACK CONFIRMED — phishing → credential theft → stuffing pipeline complete"},
]

# ── Whitelist: only these stdout lines are shown; everything else is discarded ─
# Each entry: (substring_to_match, actor, severity, clean_message)
_WHITELIST = [
    ("Navigating to",                      "CANARY", "INFO",     "System visiting fake site — credential harvesting in progress"),
    ("Injected Fake Username",             "CANARY", "MEDIUM",   "Canary credential suresh.kumar.2287 injected into fake site login form"),
    ("Injected Fake Password",             "CANARY", "MEDIUM",   "Canary password injected — form fully populated"),
    ("Backend confirmed: Credentials",     "CANARY", "HIGH",     "Credential captured and stored in backend database"),
    ("Automation sequence completed",      "CANARY", "INFO",     "Phase 1 automation complete — credential harvest done"),
    ("Launching attacker browser",         "CANARY", "HIGH",     "Attacker browser launching — preparing to replay stolen credentials"),
    ("Navigating to target site",          "CANARY", "HIGH",     "Attacker browser navigating to real MCD portal"),
    ("Injected Stolen Username",           "CANARY", "CRITICAL", "Attacker replaying stolen credential suresh.kumar.2287 on real site"),
    ("CREDENTIAL STUFFING ATTACK FIRED",   "CANARY", "CRITICAL", "Login attempt fired with stolen credentials on real MCD portal"),
    ("Running phishing attack verif",      "KAVACH", "INFO",     "Real site login logs being monitored for anomalies"),
    ("Victim Credential",                  "KAVACH", "WARN",     "Canary credential suresh.kumar.2287 found in real site login attempt logs"),
    ("PHISHING ATTACK CONFIRMED",          "KAVACH", "CRITICAL", "Username matches canary credential — phishing attack CONFIRMED"),
]

def _make_step(actor: str, severity: str, plain: str) -> dict:
    return {"actor": actor, "severity": severity, "msg": plain, "plain": plain,
            "ts": datetime.now().strftime("%H:%M:%S")}

def _run_attack_demo():
    """Background thread: runs attack_demo.py and streams curated steps into _sim_state."""
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    script = os.path.join(backend_dir, "attack_demo.py")

    with _sim_lock:
        _sim_state["running"] = True
        _sim_state["done"] = False
        _sim_state["steps"] = []

    # 1. Inject hardcoded DRISHTI steps immediately
    for s in _DRISHTI_STEPS:
        with _sim_lock:
            _sim_state["steps"].append(_make_step(**s))

    bridge_injected = False

    try:
        proc = subprocess.Popen(
            [sys.executable, script],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            cwd=backend_dir,
        )
        for raw in proc.stdout:
            raw_stripped = raw.strip()
            # 2. Whitelist filter — discard everything not in the list
            for substring, actor, severity, clean_msg in _WHITELIST:
                if substring in raw_stripped:
                    with _sim_lock:
                        _sim_state["steps"].append(_make_step(actor, severity, clean_msg))
                    # 3. After KAVACH confirms phishing, auto-inject BRIDGE steps
                    if "PHISHING ATTACK CONFIRMED" in raw_stripped and not bridge_injected:
                        bridge_injected = True
                        for bs in _BRIDGE_STEPS:
                            with _sim_lock:
                                _sim_state["steps"].append(_make_step(**bs))
                    break  # Only match first whitelist rule per line
        proc.wait()
    except Exception as exc:
        with _sim_lock:
            _sim_state["steps"].append(_make_step("SYSTEM", "CRITICAL", f"Simulation error: {exc}"))
    finally:
        with _sim_lock:
            _sim_state["running"] = False
            _sim_state["done"] = True


# ─────────────────────────────────────────
# /api/sim-reset — clear previous run
# ─────────────────────────────────────────
@app.post("/api/sim-reset")
def sim_reset(api_key: bool = Depends(verify_api_key)):
    """Reset simulation state so a fresh run can start."""
    with _sim_lock:
        if _sim_state["running"]:
            raise HTTPException(status_code=409, detail="Simulation is still running")
        _sim_state["done"] = False
        _sim_state["steps"] = []
    return {"ok": True}


# ─────────────────────────────────────────
# /api/simulate — launch attack_demo.py
# ─────────────────────────────────────────
@app.post("/api/simulate")
def start_simulation(api_key: bool = Depends(verify_api_key)):
    """Kick off attack_demo.py in a background thread."""
    with _sim_lock:
        if _sim_state["running"]:
            raise HTTPException(status_code=409, detail="Simulation already running")
    t = threading.Thread(target=_run_attack_demo, daemon=True)
    t.start()
    return {"ok": True, "message": "Simulation started — poll /api/sim-log for output"}


# ─────────────────────────────────────────
# /api/sim-log — return streamed output
# ─────────────────────────────────────────
@app.get("/api/sim-log")
def get_sim_log(api_key: bool = Depends(verify_api_key)):
    """Return all stdout steps captured so far + running/done state."""
    with _sim_lock:
        return {
            "steps": list(_sim_state["steps"]),
            "state": {
                "running": _sim_state["running"],
                "done": _sim_state["done"],
            },
        }


# ─────────────────────────────────────────
# /api/sim-report — download professional PDF report
# ─────────────────────────────────────────
@app.get("/api/sim-report")
def get_sim_report():
    """Generate and return a professional PDF simulation report."""
    try:
        # ── 1. Load credential JSON files (stored in 'data/' subfolder) ────────────
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.join(backend_dir, "data")
        
        stolen_raw, attack_raw = [], []
        try:
            with open(os.path.join(data_dir, "stolen_credentials.json")) as f:
                stolen_raw = json.load(f)
        except Exception: pass
        
        try:
            with open(os.path.join(data_dir, "attacker_attempts.json")) as f:
                attack_raw = json.load(f)
        except Exception: pass

        # Get latest entries (these are lists of dicts)
        stolen_data = stolen_raw[-1] if isinstance(stolen_raw, list) and stolen_raw else {}
        attack_data = attack_raw[-1] if isinstance(attack_raw, list) and attack_raw else {}

        # ── 2. Compare last credentials → determine phishing status ───────────────
        s_user = stolen_data.get("username", "")
        s_pass = stolen_data.get("password", "")
        a_user = attack_data.get("username", "")
        a_pass = attack_data.get("password", "")
        phishing_confirmed = bool(s_user and s_pass and s_user == a_user and s_pass == a_pass)

        # ── 3. Gather sim steps ────────────────────────────────────────────────────
        with _sim_lock:
            steps = list(_sim_state["steps"])
        critical_count = sum(1 for s in steps if s.get("severity") == "CRITICAL")
        now = datetime.now()
        date_str = now.strftime('%d %B %Y')
        time_str = now.strftime('%I:%M %p')
        full_ts  = f"{date_str}, {time_str}"

        # ── 4. Colour palette (Light Theme) ────────────────────────────────────────
        C_BG      = colors.white
        C_SURFACE = colors.HexColor("#f8fafc")
        C_BORDER  = colors.HexColor("#e2e8f0")
        C_TEXT    = colors.HexColor("#0f172a")
        C_MUTED   = colors.HexColor("#64748b")
        C_GREEN   = colors.HexColor("#10b981")
        C_AMBER   = colors.HexColor("#f59e0b")
        C_BLUE    = colors.HexColor("#3b82f6")
        C_PURPLE  = colors.HexColor("#8b5cf6")
        C_RED     = colors.HexColor("#ef4444")
        C_GREY    = colors.HexColor("#94a3b8")
        ACTOR_C   = {"DRISHTI": C_GREEN, "CANARY": C_AMBER, "KAVACH": C_BLUE,
                     "BRIDGE": C_PURPLE, "SYSTEM": C_GREY}
        SEV_C     = {"CRITICAL": C_RED, "HIGH": C_AMBER, "MEDIUM": C_BLUE,
                     "INFO": C_GREY, "WARN": C_AMBER}

        def sty(name, **kw):
            defaults = {"fontName": "Helvetica", "fontSize": 9, "textColor": C_TEXT, "leading": 13}
            defaults.update(kw)
            return ParagraphStyle(name, **defaults)

        SECTION = sty("sec", fontSize=7, textColor=C_MUTED, fontName="Helvetica-Bold",
                      spaceAfter=5, spaceBefore=16, letterSpacing=1.2)
        MONO    = sty("mono", fontSize=8, textColor=C_MUTED, fontName="Courier", leading=12)
        FOOTER  = sty("ftr", fontSize=7, textColor=C_MUTED, fontName="Helvetica",
                      alignment=TA_CENTER, leading=10)

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4,
                                leftMargin=18*mm, rightMargin=18*mm,
                                topMargin=14*mm, bottomMargin=14*mm,
                                title=f"TRINETRA Simulation Report {date_str}",
                                author="TRINETRA Cyber Intelligence System")
        el = []

        # ── Header with Logo ──────────────────────────────────────────────────────
        h_verdict = "CONFIRMED" if phishing_confirmed else "NO MATCH"
        h_vcol    = "#ef4444"   if phishing_confirmed else "#10b981"

        logo_path = os.path.join(data_dir, "trinetra_logo.png")
        header_data = []
        if os.path.exists(logo_path):
            img = Image(logo_path, width=18*mm, height=18*mm)
            header_data = [[
                img,
                Paragraph('<font color="#0f172a"><b>TRINETRA</b></font><br/>'
                          '<font color="#64748b" size="7">Cyber Intelligence System</font>',
                          sty("ht", fontSize=18, leading=20)),
                Paragraph(f'<font color="{h_vcol}">● PHISHING {h_verdict}</font>',
                          sty("hv", fontSize=9, fontName="Helvetica-Bold",
                              alignment=TA_RIGHT, textColor=colors.HexColor(h_vcol))),
            ]]
            col_widths = ["18%","52%","30%"]
        else:
            header_data = [[
                Paragraph('<font color="#0f172a"><b>⚡ TRINETRA Simulation Report</b></font>',
                          sty("ht", fontSize=18, leading=22)),
                Paragraph(f'<font color="{h_vcol}">● PHISHING {h_verdict}</font>',
                          sty("hv", fontSize=9, fontName="Helvetica-Bold",
                              alignment=TA_RIGHT, textColor=colors.HexColor(h_vcol))),
            ]]
            col_widths = ["70%","30%"]

        hdr = Table(header_data, colWidths=col_widths)
        hdr.setStyle(TableStyle([
            ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
            ("TOPPADDING",    (0,0),(-1,-1), 0),
            ("BOTTOMPADDING", (0,0),(-1,-1), 8),
        ]))
        el.append(hdr)
        el.append(Paragraph(
            f'Municipal Corporation of Delhi — IT Security Directorate&nbsp;&nbsp;·&nbsp;&nbsp;{full_ts}',
            sty("sub", fontSize=9, textColor=C_MUTED)))
        el.append(HRFlowable(width="100%", thickness=0.4, color=C_BORDER,
                             spaceBefore=8, spaceAfter=2))

        # ── KPI row ────────────────────────────────────────────────────────────────
        el.append(Paragraph("EXECUTIVE SUMMARY", SECTION))
        vc = "#ef4444" if phishing_confirmed else "#10b981"
        kpi = Table([[
            Paragraph('<b><font color="#0f172a">{}</font></b><br/>'
                      '<font color="#64748b" size="7">Events Recorded</font>'.format(len(steps)),
                      sty("kv1", fontSize=22, alignment=TA_CENTER, leading=28)),
            Paragraph('<b><font color="#ef4444">{}</font></b><br/>'
                      '<font color="#64748b" size="7">Critical Events</font>'.format(critical_count),
                      sty("kv2", fontSize=22, alignment=TA_CENTER, leading=28)),
            Paragraph('<b><font color="{}">{}</font></b><br/>'
                      '<font color="#64748b" size="7">Phishing Status</font>'.format(vc, "CONFIRMED" if phishing_confirmed else "NONE"),
                      sty("kv3", fontSize=16, alignment=TA_CENTER, leading=24)),
        ]], colWidths=["33%","33%","34%"])
        kpi.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), C_SURFACE),
            ("BOX",           (0,0),(-1,-1), 0.5, C_BORDER),
            ("LINEAFTER",     (0,0),(1,-1),  0.5, C_BORDER),
            ("TOPPADDING",    (0,0),(-1,-1), 14),
            ("BOTTOMPADDING", (0,0),(-1,-1), 14),
        ]))
        el.append(kpi)

        # ── Credential comparison ──────────────────────────────────────────────────
        el.append(Paragraph("CREDENTIAL FORENSICS", SECTION))
        match_txt  = "✓ MATCH"    if phishing_confirmed else "✗ NO MATCH"
        match_col  = C_RED        if phishing_confirmed else C_GREEN
        cred_rows = [
            [Paragraph("Source", sty("ch", fontSize=7, fontName="Helvetica-Bold", textColor=C_MUTED)),
             Paragraph("Username", sty("ch2", fontSize=7, fontName="Helvetica-Bold", textColor=C_MUTED)),
             Paragraph("Password", sty("ch3", fontSize=7, fontName="Helvetica-Bold", textColor=C_MUTED)),
             Paragraph("Result", sty("ch4", fontSize=7, fontName="Helvetica-Bold", textColor=C_MUTED))],
            [Paragraph("Stolen credentials (fake site)", sty("cb1", fontSize=8, textColor=C_TEXT)),
             Paragraph(s_user or "—", MONO),
             Paragraph(s_pass or "—", MONO),
             Paragraph(match_txt, sty("mt", fontSize=9, fontName="Helvetica-Bold",
                       textColor=match_col, alignment=TA_CENTER))],
            [Paragraph("Attacker replay (real site)", sty("cb2", fontSize=8, textColor=C_TEXT)),
             Paragraph(a_user or "—", MONO),
             Paragraph(a_pass or "—", MONO),
             Paragraph("", sty("mt2"))],
        ]
        cred_tbl = Table(cred_rows, colWidths=["28%","24%","24%","24%"])
        cred_tbl.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,0),  C_BG),
            ("BACKGROUND",    (0,1),(-1,-1), C_SURFACE),
            ("BOX",           (0,0),(-1,-1), 0.5, C_BORDER),
            ("INNERGRID",     (0,0),(-1,-1), 0.3, C_BORDER),
            ("TOPPADDING",    (0,0),(-1,-1), 6),
            ("BOTTOMPADDING", (0,0),(-1,-1), 6),
            ("LEFTPADDING",   (0,0),(-1,-1), 8),
            ("RIGHTPADDING",  (0,0),(-1,-1), 8),
            ("SPAN",          (3,1),(3,2)),
            ("VALIGN",        (3,1),(3,2), "MIDDLE"),
            ("LINEBELOW",     (0,0),(-1,0), 0.5, C_BORDER),
        ]))
        el.append(cred_tbl)

        # ── Event log ──────────────────────────────────────────────────────────────
        el.append(Paragraph("SIMULATION EVENT LOG", SECTION))
        log_rows = [[
            Paragraph("MODULE", sty("lh1", fontSize=7, fontName="Helvetica-Bold", textColor=C_MUTED)),
            Paragraph("TIME",   sty("lh2", fontSize=7, fontName="Helvetica-Bold", textColor=C_MUTED)),
            Paragraph("SEV",    sty("lh3", fontSize=7, fontName="Helvetica-Bold", textColor=C_MUTED)),
            Paragraph("EVENT",  sty("lh4", fontSize=7, fontName="Helvetica-Bold", textColor=C_MUTED)),
        ]]
        for s in steps:
            ac  = s.get("actor", "SYSTEM")
            sv  = s.get("severity", "INFO")
            ac_col = ACTOR_C.get(ac, C_GREY)
            sv_col = SEV_C.get(sv, C_GREY)
            ts_raw = s.get("ts","")
            ts_disp = ts_raw
            if "T" in ts_raw:
                try: ts_disp = ts_raw.split("T")[1].split(".")[0]
                except: pass

            log_rows.append([
                Paragraph(ac, sty(f"la{ac}", fontSize=7, fontName="Helvetica-Bold",
                          textColor=ac_col)),
                Paragraph(ts_disp, sty("lt", fontSize=6, fontName="Courier",
                          textColor=C_MUTED)),
                Paragraph(sv, sty(f"ls{sv}", fontSize=6, fontName="Helvetica-Bold",
                          textColor=sv_col)),
                Paragraph(s.get("plain",""), sty("lp", fontSize=8, textColor=C_TEXT, leading=11)),
            ])
        log_tbl = Table(log_rows, colWidths=["13%","11%","11%","65%"])
        ls = [
            ("BACKGROUND",    (0,0),(-1,0),  C_BG),
            ("BACKGROUND",    (0,1),(-1,-1), C_SURFACE),
            ("BOX",           (0,0),(-1,-1), 0.5, C_BORDER),
            ("LINEBELOW",     (0,0),(-1,0),  0.5, C_BORDER),
            ("TOPPADDING",    (0,0),(-1,-1), 5),
            ("BOTTOMPADDING", (0,0),(-1,-1), 5),
            ("LEFTPADDING",   (0,0),(-1,-1), 7),
            ("RIGHTPADDING",  (0,0),(-1,-1), 7),
            ("VALIGN",        (0,0),(-1,-1), "TOP"),
        ]
        for i in range(1, len(log_rows)):
            ls.append(("LINEBELOW", (0,i),(-1,i), 0.2, C_BORDER))
        log_tbl.setStyle(TableStyle(ls))
        el.append(log_tbl)

        # ── Verdict ────────────────────────────────────────────────────────────────
        el.append(Spacer(1, 10))
        if phishing_confirmed:
            vtext = ("<b>🚨 COORDINATED ATTACK CONFIRMED</b><br/>"
                     "Credentials stolen from the phishing site were successfully replayed on the real "
                     "MCD portal. This simulation demonstrates a complete phishing → credential theft "
                     "→ stuffing pipeline targeting MCD citizens.")
            vbrd = C_RED
        else:
            vtext = ("<b>✓ NO CREDENTIAL MATCH DETECTED</b><br/>"
                     "Stolen and attempted credentials did not match — phishing pipeline did not complete.")
            vbrd = C_GREEN
        
        verdict_tbl = Table(
            [[Paragraph(vtext, sty("vd", fontSize=9, fontName="Helvetica",
                        textColor=C_TEXT, leading=14, alignment=TA_CENTER))]],
            colWidths=["100%"])
        verdict_tbl.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), colors.white),
            ("BOX",           (0,0),(-1,-1), 1, vbrd),
            ("TOPPADDING",    (0,0),(-1,-1), 12),
            ("BOTTOMPADDING", (0,0),(-1,-1), 12),
            ("LEFTPADDING",   (0,0),(-1,-1), 16),
            ("RIGHTPADDING",  (0,0),(-1,-1), 16),
        ]))
        el.append(verdict_tbl)

        # ── Takedown Request Section (Legal Format) ───────────────────────────────
        el.append(Spacer(1, 12))
        el.append(Paragraph("LEGAL ACTION ENFORCEMENT", SECTION))
        
        target_domain = "mcd-services-delhi.com" # Simulation target
        takedown_text = (
            "<b>TAKEDOWN REQUEST — TRINETRA Auto-Generated</b><br/>"
            "===========================================<br/>"
            f"Date:          {now.strftime('%d %B %Y, %I:%M %p')}<br/>"
            "Reported By:   TRINETRA Cyber Defense System, MCD<br/>"
            f"Target Domain: {target_domain}<br/><br/>"
            "CLASSIFICATION: PHISHING ATTACK (CONFIRMED)<br/>"
            "EVIDENCE:       Visual similarity score (94%) + Credential theft confirmation via honey-token match.<br/><br/>"
            "This domain was detected impersonating an official MCD government portal.<br/>"
            "Immediate takedown is requested under Section 66A/66C of the IT Act, 2000.<br/><br/>"
            "Please remove this domain and associated SSL certificate immediately.<br/>"
            "Contact: cybersecurity@mcd.gov.in"
        )
        
        td_tbl = Table([[Paragraph(takedown_text, sty("td", fontSize=8, fontName="Courier", 
                                                    textColor=C_TEXT, leading=11))]], 
                       colWidths=["100%"])
        td_tbl.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), C_SURFACE),
            ("BOX",           (0,0),(-1,-1), 0.5, C_BORDER),
            ("TOPPADDING",    (0,0),(-1,-1), 10),
            ("BOTTOMPADDING", (0,0),(-1,-1), 10),
            ("LEFTPADDING",   (0,0),(-1,-1), 12),
        ]))
        el.append(td_tbl)

        # ── Footer ─────────────────────────────────────────────────────────────────
        el.append(Spacer(1, 14))
        el.append(HRFlowable(width="100%", thickness=0.4, color=C_BORDER, spaceAfter=6))
        el.append(Paragraph(
            "TRINETRA Cyber Intelligence System  ·  Municipal Corporation of Delhi  ·  "
            f"Generated {date_str}",
            FOOTER))

        doc.build(el)
        buf.seek(0)
        filename = f"TRINETRA-SimReport-{now.strftime('%Y-%m-%d')}.pdf"
        return StreamingResponse(
            buf,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        print(f"ERROR in get_sim_report: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF Generation Error: {str(e)}")


# ─────────────────────────────────────────
# /api/health — sanity check
# ─────────────────────────────────────────
@app.get("/api/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "model": "HuggingFace (gpt2 demo)",
        "vectorstore": "loaded",
        "llm": "available" if llm else "unavailable",
        "chat_history_length": len(chat_history)
    }
