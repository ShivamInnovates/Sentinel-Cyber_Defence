from pdf_loader import get_vectorstore
from chat_history import ChatHistory
from langchain_classic.chains import ConversationalRetrievalChain
from langchain_classic.prompts import PromptTemplate
from langchain_classic.memory import ConversationBufferMemory
from langchain_ollama import OllamaLLM

# Load components
vectorstore = get_vectorstore()
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

llm = OllamaLLM(model="llama3.2", base_url="http://localhost:11434")

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
    output_key="answer"
)

RAG_PROMPT = PromptTemplate(
    input_variables=["context", "question", "chat_history"],
    template="""Answer only from context..."""
)

qa_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=retriever,
    memory=memory,
    return_source_documents=True
)

chat_history = ChatHistory()


# 🔥 MAIN FUNCTION (IMPORTANT)
def run_chatbot(query: str):
    query_lower = query.lower()

    # 🔥 SMART FALLBACKS (before RAG)
    if "trinetra" in query_lower:
        return {
            "answer": (
                "TRINETRA is a comprehensive cyber defense system combining three intelligence modules:\n"
                "- Drishti: phishing detection using certificate monitoring and visual similarity\n"
                "- Kavach: anomaly detection for login patterns and network behavior\n"
                "- Bridge: correlation engine linking external threats with internal events"
            ),
            "sources": [],
            "history": []
        }

    if any(word in query_lower for word in ["hi", "hello", "hey"]):
        return {
            "answer": "Hello! I'm TRINETRA's AI assistant. Ask me about threats, phishing, or system monitoring.",
            "sources": [],
            "history": []
        }

    # 🧠 RAG execution
    try:
        result = qa_chain({"question": query})

        answer = result.get("answer", "")

        # ⚠️ If RAG fails → fallback
        if not answer or "don't know" in answer.lower():
            answer = (
                "I couldn't find this in the knowledge base, but here's what I know:\n"
                "TRINETRA is a cyber defense system focused on threat detection, phishing analysis, "
                "and anomaly monitoring across critical infrastructure."
            )

        sources = [
            {
                "page": doc.metadata.get("page", "unknown"),
                "source": doc.metadata.get("source", "unknown"),
                "snippet": doc.page_content[:200]
            }
            for doc in result.get("source_documents", [])
        ]

        return {
            "answer": answer,
            "sources": sources,
            "history": []
        }

    except Exception as e:
        print("Chatbot error:", e)

        return {
            "answer": "TRINETRA encountered an issue. Please try again.",
            "sources": [],
            "history": []
        }