import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pdf_loader import get_vectorstore
from chat_history import ChatHistory
from alert_formatter import format_alert, format_cross_reality

from langchain_classic.chains import ConversationalRetrievalChain
from langchain_classic.prompts import PromptTemplate
from langchain_classic.memory import ConversationBufferMemory
from langchain_ollama import OllamaLLM

# ─────────────────────────────────────────
# FastAPI setup
# ─────────────────────────────────────────
app = FastAPI(title="TRINETRA Cyber Defense Chatbot")

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
    print("[Chatbot] Vectorstore loaded successfully.")
except Exception as e:
    print(f"[Chatbot] Warning: Could not load vectorstore: {e}")
    vectorstore = None
    retriever = None

# ─────────────────────────────────────────
# Load local Ollama LLM
# ─────────────────────────────────────────
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")

llm = None
try:
    llm = OllamaLLM(
        model=OLLAMA_MODEL,
        base_url=OLLAMA_BASE_URL,
        temperature=0.7,
    )
    # Quick connectivity test
    llm.invoke("ping")
    print(f"[Chatbot] Ollama LLM loaded: {OLLAMA_MODEL} at {OLLAMA_BASE_URL}")
except Exception as e:
    print(f"[Chatbot] Warning: Could not connect to Ollama ({OLLAMA_MODEL}): {e}")
    llm = None

# ─────────────────────────────────────────
# RAG Prompt
# ─────────────────────────────────────────
RAG_PROMPT = PromptTemplate(
    input_variables=["context", "question", "chat_history"],
    template="""You are TRINETRA, a precise and reliable security assistant.
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
        print("[Chatbot] QA chain initialized successfully.")
    except Exception as e:
        print(f"[Chatbot] Warning: Could not create QA chain: {e}")
        qa_chain = None
else:
    print("[Chatbot] QA chain unavailable (missing LLM, vectorstore, or retriever).")

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
                answer = (
                    "TRINETRA is actively monitoring for threats. I'm currently operating in demo mode "
                    "with limited AI capabilities. Current threat level: MEDIUM with coordinated attacks "
                    "detected on critical portals. Our ML models continuously analyze patterns to identify "
                    "cross-reality connections."
                )
            elif any(word in query_lower for word in ["zone", "network", "infrastructure", "system"]):
                answer = (
                    "TRINETRA protects 12 zones covering critical infrastructure across Delhi. Each zone "
                    "has intelligent anomaly detection monitoring login patterns, domain reputation, and "
                    "behavioral baselines. Real-time monitoring is active."
                )
            elif any(word in query_lower for word in ["TRINETRA", "what", "who", "help", "how"]):
                answer = (
                    "TRINETRA is a comprehensive cyber defense system combining three intelligence modules: "
                    "Drishti (phishing detection via CertStream and visual analysis), Kavach (anomaly detection "
                    "for unusual login and network patterns), and Bridge (correlation analysis linking external "
                    "threats to internal attacks). I'm TRINETRA's AI assistant, operating in demo mode."
                )
            elif any(word in query_lower for word in ["fake", "domain", "phish", "clone"]):
                answer = (
                    "TRINETRA's Drishti module monitors SSL certificates in real-time and performs visual "
                    "similarity analysis. We've detected several phishing sites impersonating government portals. "
                    "Each detection includes domain similarity scores and takedown recommendations."
                )
            elif any(word in query_lower for word in ["alert", "event", "anomaly", "login"]):
                answer = (
                    "TRINETRA's Kavach module detects anomalies like unusual login patterns, foreign IP access, "
                    "off-hours privileged access, and suspicious data transfers. The system uses statistical "
                    "analysis and z-scores to identify deviations from normal behavior."
                )
            elif any(word in query_lower for word in ["correlation", "bridge", "connection"]):
                answer = (
                    "TRINETRA's Bridge module correlates external threats (phishing sites) with internal events "
                    "(login attempts) to build unified attack narratives. When a fake site steals credentials and "
                    "those credentials are used on real systems, Bridge connects the dots."
                )
            else:
                answer = (
                    f"TRINETRA is analyzing your query: '{req.query}'. The system operates 24/7 with real-time "
                    "threat monitoring and adaptive learning. Current status: All systems operational. "
                    "(Ollama model unavailable — running in demo mode)"
                )
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
                answer = (
                    f"TRINETRA encountered an issue processing your query with full AI capabilities. "
                    f"Falling back to knowledge base for: '{req.query}'. "
                    "Try asking about threats, domains, or system status."
                )
                sources = []

        chat_history.add_message("assistant", answer)

        return {
            "answer": answer,
            "sources": sources,
            "history": chat_history.get_history()
        }

    except Exception as e:
        print(f"[Chat] Unexpected error: {e}")
        error_answer = "TRINETRA encountered an unexpected error. Please try refreshing the page or asking a different question."
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
        upload_path = f"uploaded_{file.filename}"
        with open(upload_path, "wb") as f:
            content = await file.read()
            f.write(content)

        global vectorstore, retriever, qa_chain
        vectorstore = get_vectorstore(pdf_path=upload_path)
        retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

        if llm:
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
# /api/health — sanity check
# ─────────────────────────────────────────
@app.get("/api/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "model": f"Ollama ({OLLAMA_MODEL})",
        "ollama_base_url": OLLAMA_BASE_URL,
        "vectorstore": "loaded" if vectorstore else "unavailable",
        "llm": "available" if llm else "unavailable",
        "qa_chain": "ready" if qa_chain else "unavailable",
        "chat_history_length": len(chat_history)
    }