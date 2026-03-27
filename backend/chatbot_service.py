# from pdf_loader import get_vectorstore
# from chat_history import ChatHistory
# from langchain_classic.chains import ConversationalRetrievalChain
# from langchain_classic.prompts import PromptTemplate
# from langchain_classic.memory import ConversationBufferMemory
# from langchain_ollama import OllamaLLM

# # 🔥 Load vectorstore (ensure good chunking in pdf_loader)
# vectorstore = get_vectorstore()

# retriever = vectorstore.as_retriever(
#     search_kwargs={
#         "k": 4,  # fewer but more relevant chunks
#     }
# )

# # 🔥 LLM
# llm = OllamaLLM(
#     model="llama3.2",
#     base_url="http://localhost:11434",
#     temperature=0.2  # 🔥 reduce hallucination
# )

# # 🔥 Memory
# memory = ConversationBufferMemory(
#     memory_key="chat_history",
#     return_messages=True,
#     output_key="answer"
# )

# # 🔥 STRONG PROMPT (VERY IMPORTANT)
# RAG_PROMPT = PromptTemplate(
#     input_variables=["context", "question", "chat_history"],
#     template="""
#     You are TRINETRA AI — a strict cybersecurity assistant.

#     RULES:
#     1. Answer ONLY using the provided context.
#     2. Do NOT add outside knowledge.
#     3. If answer is not present → say: "I don't have enough information in the document."
#     4. Be precise and structured.
#     5. Prefer bullet points when possible.

#     ---------------------
#     CONTEXT:
#     {context}
#     ---------------------

#     CHAT HISTORY:
#     {chat_history}

#     QUESTION:
#     {question}

#     FINAL ANSWER:
#     """
#     )

# # 🔥 QA Chain
# qa_chain = ConversationalRetrievalChain.from_llm(
#     llm=llm,
#     retriever=retriever,
#     memory=memory,
#     return_source_documents=True,
#     combine_docs_chain_kwargs={"prompt": RAG_PROMPT},
#     verbose=False
# )

# chat_history = ChatHistory()

# from duckduckgo_search import DDGS

# def web_search(query):
#     try:
#         results = DDGS().text(query, max_results=3)

#         snippets = []
#         for r in results:
#             snippets.append(r["body"])

#         return "\n".join(snippets)

#     except Exception as e:
#         print("Web search error:", e)
#         return None


# # 🚀 MAIN FUNCTION
# def run_chatbot(query: str):
#     query_lower = query.lower().strip()

#     # 🔥 1. Greeting
#     if any(word in query_lower for word in ["hi", "hello", "hey"]):
#         return {
#             "answer": "Hey 👋 I'm TRINETRA AI. Ask me anything about cybersecurity or threats.",
#             "sources": [],
#             "history": []
#         }

#     # 🔥 2. Try RAG first
#     try:
#         result = qa_chain.invoke({
#             "question": query
#         })

#         answer = result.get("answer", "").strip()

#         if answer and "I don't have enough information" not in answer:
#             return {
#                 "answer": answer,
#                 "sources": [
#                     {
#                         "page": doc.metadata.get("page", "unknown"),
#                         "snippet": doc.page_content[:150]
#                     }
#                     for doc in result.get("source_documents", [])
#                 ],
#                 "history": []
#             }

#     except Exception as e:
#         print("RAG error:", e)
        
#     if "summarize" in query_lower:
#         try:
#             docs = vectorstore.similarity_search("", k=10)  # fetch broad content

#             full_text = "\n".join([doc.page_content for doc in docs])

#             prompt = f"""
#                  Summarize the following document in 5-6 bullet points:

#                 {full_text}
#                 """

#             summary = llm.invoke(prompt)

#             return {
#                 "answer": summary,
#                 "sources": ["pdf-summary"],
#                 "history": []
#             }

#         except Exception as e:
#             print("Summary error:", e)

#     # 🌐 3. WEB FALLBACK (IMPROVED 🔥)
#     web_data = web_search(query)

#     if web_data:
#         try:
#             prompt = f"""
#                 You are a cybersecurity expert.

#                 Explain the following question in a clear, detailed, and structured way.

#                 Include:
#                 - Definition
#                 - Key components
#                 - Real-world examples

#                 Context:
#                 {web_data}

#                 Question:
#                 {query}

#                 Answer:
#                 """

#             response = llm.invoke(prompt)

#             return {
#                         "answer": response,
#                         "sources": ["web"],
#                         "history": []
#                     }

#         except Exception as e:
#            print("Web LLM error:", e)

#     # ❌ 4. Final fallback
#     return {
#         "answer": "I couldn't find relevant information. Try rephrasing your question.",
#         "sources": [],
#         "history": []
#     }

from dotenv import load_dotenv
import os

load_dotenv()
# =========================
# IMPORTS
# =========================
from pdf_loader import get_vectorstore
from chat_history import ChatHistory

from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory

from groq import Groq
from duckduckgo_search import DDGS

# =========================
# VECTOR STORE
# =========================
vectorstore = get_vectorstore()

retriever = vectorstore.as_retriever(
    search_kwargs={"k": 4}
)

# =========================
# GROQ LLM WRAPPER
# =========================
client = Groq()

class GroqLLM:
    def __init__(self, model="qwen/qwen3-32b"):
        self.model = model

    def invoke(self, prompt: str):
        completion = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_completion_tokens=1024,
            top_p=0.95,
            stream=False
        )
        return completion.choices[0].message.content


llm = GroqLLM()

# =========================
# MEMORY (OPTIONAL)
# =========================
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

chat_history = ChatHistory()

# =========================
# STRONG RAG PROMPT
# =========================
RAG_PROMPT = PromptTemplate(
    input_variables=["context", "question", "chat_history"],
    template="""
You are TRINETRA AI — a strict cybersecurity assistant.

RULES:
1. Answer ONLY using the provided context.
2. Do NOT add outside knowledge.
3. If answer is not present → say: "I don't have enough information in the document."
4. Be precise and structured.
5. Prefer bullet points when possible.

---------------------
CONTEXT:
{context}
---------------------

CHAT HISTORY:
{chat_history}

QUESTION:
{question}

FINAL ANSWER:
"""
)

# =========================
# WEB SEARCH
# =========================
def web_search(query):
    try:
        results = DDGS().text(query, max_results=3)

        snippets = []
        for r in results:
            snippets.append(r["body"])

        return "\n".join(snippets)

    except Exception as e:
        print("Web search error:", e)
        return None


# =========================
# MAIN CHATBOT FUNCTION
# =========================
def run_chatbot(query: str):
    query_lower = query.lower().strip()

    # =====================
    # 1. GREETING
    # =====================
    if any(word in query_lower for word in ["hi", "hello", "hey"]):
        return {
            "answer": "Hey 👋 I'm TRINETRA AI. Ask me anything about cybersecurity or threats.",
            "sources": [],
            "history": []
        }

    # =====================
    # 2. RAG (PDF SEARCH)
    # =====================
    try:
        docs = retriever.get_relevant_documents(query)

        context = "\n\n".join([doc.page_content for doc in docs])

        prompt = RAG_PROMPT.format(
            context=context,
            question=query,
            chat_history=""
        )

        answer = llm.invoke(prompt).strip()

        if answer and "I don't have enough information" not in answer:
            return {
                "answer": answer,
                "sources": [
                    {
                        "page": doc.metadata.get("page", "unknown"),
                        "snippet": doc.page_content[:150]
                    }
                    for doc in docs
                ],
                "history": []
            }

    except Exception as e:
        print("RAG error:", e)

    # =====================
    # 3. SUMMARIZATION
    # =====================
    if "summarize" in query_lower:
        try:
            docs = vectorstore.similarity_search("", k=10)

            full_text = "\n".join([doc.page_content for doc in docs])

            prompt = f"""
Summarize the following document in 5-6 bullet points:

{full_text}
"""

            summary = llm.invoke(prompt)

            return {
                "answer": summary,
                "sources": ["pdf-summary"],
                "history": []
            }

        except Exception as e:
            print("Summary error:", e)

    # =====================
    # 4. WEB FALLBACK
    # =====================
    web_data = web_search(query)

    if web_data:
        try:
            prompt = f"""
You are a cybersecurity expert.

Explain the following question in a clear, detailed, and structured way.

Include:
- Definition
- Key components
- Real-world examples

Context:
{web_data}

Question:
{query}

Answer:
"""

            response = llm.invoke(prompt)

            return {
                "answer": response,
                "sources": ["web"],
                "history": []
            }

        except Exception as e:
            print("Web LLM error:", e)

    # =====================
    # 5. FINAL FALLBACK
    # =====================
    return {
        "answer": "I couldn't find relevant information. Try rephrasing your question.",
        "sources": [],
        "history": []
    }