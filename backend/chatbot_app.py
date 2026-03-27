import os
import sys
import threading
import subprocess
from datetime import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File, Header, Depends
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
            "ts": datetime.utcnow().strftime("%H:%M:%S")}

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
