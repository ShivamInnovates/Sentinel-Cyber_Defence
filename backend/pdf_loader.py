import os
from langchain.document_loaders import PyPDFLoader
from langchain.vectorstores import FAISS
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

VECTORSTORE_PATH = "sentinel_vectorstore"

def load_pdf(pdf_path="sentinel.pdf"):
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()
    return docs

def get_vectorstore(pdf_path="sentinel.pdf"):
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    if os.path.exists(VECTORSTORE_PATH):
        vectorstore = FAISS.load_local(
            VECTORSTORE_PATH,
            embeddings,
            allow_dangerous_deserialization=True   # required in newer LangChain versions
        )
        print(f"[pdf_loader] Loaded vectorstore from disk: {VECTORSTORE_PATH}")
    else:
        print(f"[pdf_loader] Building vectorstore from {pdf_path}...")
        docs = load_pdf(pdf_path)

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50
        )
        chunks = splitter.split_documents(docs)
        print(f"[pdf_loader] Split into {len(chunks)} chunks")

        vectorstore = FAISS.from_documents(chunks, embeddings)
        vectorstore.save_local(VECTORSTORE_PATH)
        print(f"[pdf_loader] Vectorstore saved to {VECTORSTORE_PATH}")

    return vectorstore
