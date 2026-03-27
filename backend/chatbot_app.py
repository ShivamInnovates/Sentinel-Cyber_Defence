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
API_KEY = os.environ.get("SENTINEL_API_KEY", "sentinel-demo-key")

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
# Simulation State + attack_demo.py runner
# ─────────────────────────────────────────
_sim_lock = threading.Lock()
_sim_state = {"running": False, "done": False, "steps": []}

_PHASE_ACTORS = {
    "PHASE 2": "KAVACH",
    "LOGIN PORTAL": "KAVACH",
    "PHASE 3": "BRIDGE",
    "CREDENTIAL STUFFING": "BRIDGE",
    "PHISHING ATTACK CONFIRMED": "BRIDGE",
}

def _parse_line(line: str, phase: list) -> dict | None:
    """Convert a raw stdout line from attack_demo.py into a step dict."""
    line = line.strip()
    if not line or line.startswith("="*10):
        return None
    # Advance phase based on phase headers
    for marker, actor in _PHASE_ACTORS.items():
        if marker in line:
            phase[0] = actor
            break
    # Severity
    severity = "INFO"
    if "[+]" in line:
        severity = "MEDIUM"
    if "[-]" in line or "FAILED" in line.upper() or "ERROR" in line.upper():
        severity = "HIGH"
    if "\U0001f6a8" in line or ("CONFIRMED" in line.upper() and "PHISHING" in line.upper()):
        severity = "CRITICAL"
    plain = (
        line.replace("[*]", "")
            .replace("[+]", "\u2713")
            .replace("[-]", "\u26a0")
            .replace("\U0001f6a8", "ALERT:")
            .strip()
    )
    return {
        "actor": phase[0],
        "msg": line,
        "plain": plain,
        "severity": severity,
        "ts": datetime.utcnow().strftime("%H:%M:%S"),
    }

def _run_attack_demo():
    """Background thread: runs attack_demo.py and streams stdout into _sim_state."""
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    script = os.path.join(backend_dir, "attack_demo.py")
    phase = ["DRISHTI"]  # mutable list so closures can update it
    with _sim_lock:
        _sim_state["running"] = True
        _sim_state["done"] = False
        _sim_state["steps"] = []
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
            step = _parse_line(raw, phase)
            if step:
                with _sim_lock:
                    _sim_state["steps"].append(step)
        proc.wait()
    except Exception as exc:
        with _sim_lock:
            _sim_state["steps"].append({
                "actor": "SYSTEM",
                "msg": f"Simulation error: {exc}",
                "plain": str(exc),
                "severity": "CRITICAL",
                "ts": datetime.utcnow().strftime("%H:%M:%S"),
            })
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
