from langchain.document_loaders import PyPDFLoader
from langchain.vectorstores import FAISS
from langchain.embeddings import HuggingFaceEmbeddings
import os

VECTORSTORE_PATH = "sentinel_vectorstore"

def load_pdf(pdf_path="sentinel.pdf"):
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()
    return docs

def get_vectorstore(pdf_path="sentinel.pdf"):
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    if os.path.exists(VECTORSTORE_PATH):
        vectorstore = FAISS.load_local(VECTORSTORE_PATH, embeddings)
    else:
        docs = load_pdf(pdf_path)
        vectorstore = FAISS.from_documents(docs, embeddings)
        vectorstore.save_local(VECTORSTORE_PATH)
    return vectorstore
