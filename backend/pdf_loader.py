import os
from langchain.document_loaders import PyPDFLoader
from langchain.vectorstores import FAISS
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

VECTORSTORE_PATH = "sentinel_vectorstore"

def load_pdf(pdf_path="sentinel.pdf"):
    """Load PDF with error handling."""
    if not os.path.exists(pdf_path):
        print(f"[pdf_loader] Warning: PDF file not found at {pdf_path}")
        return []
    
    try:
        loader = PyPDFLoader(pdf_path)
        docs = loader.load()
        print(f"[pdf_loader] Successfully loaded {len(docs)} pages from {pdf_path}")
        return docs
    except Exception as e:
        print(f"[pdf_loader] Error loading PDF: {e}")
        return []

def get_vectorstore(pdf_path="sentinel.pdf"):
    """Get or create vectorstore with comprehensive error handling."""
    try:
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    except Exception as e:
        print(f"[pdf_loader] Error loading embeddings model: {e}")
        raise

    # Try to load existing vectorstore
    if os.path.exists(VECTORSTORE_PATH):
        try:
            vectorstore = FAISS.load_local(
                VECTORSTORE_PATH,
                embeddings,
                allow_dangerous_deserialization=True   # required in newer LangChain versions
            )
            print(f"[pdf_loader] Loaded vectorstore from disk: {VECTORSTORE_PATH}")
            return vectorstore
        except Exception as e:
            print(f"[pdf_loader] Error loading existing vectorstore: {e}. Will rebuild...")

    # Build new vectorstore
    print(f"[pdf_loader] Building vectorstore from {pdf_path}...")
    docs = load_pdf(pdf_path)
    
    if not docs:
        print(f"[pdf_loader] Warning: No documents loaded. Creating empty vectorstore...")
        # Create a minimal vectorstore with a dummy document
        dummy_doc = type('obj', (object,), {
            'page_content': 'SENTINEL Cyber Defense System - Default documentation. Ask about threats, domains, or system status.',
            'metadata': {'source': 'default', 'page': 0}
        })()
        docs = [dummy_doc]

    try:
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
    except Exception as e:
        print(f"[pdf_loader] Error creating vectorstore: {e}")
        raise

