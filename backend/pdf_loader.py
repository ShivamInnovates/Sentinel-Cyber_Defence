import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

VECTORSTORE_PATH = "sentinel_vectorstore"


# 🔥 Clean text (important for PDFs)
def clean_text(text: str) -> str:
    return " ".join(text.split())


def load_pdf(pdf_path="TRINETRA.pdf"):
    """Load and clean PDF."""
    if not os.path.exists(pdf_path):
        print(f"[pdf_loader] PDF not found: {pdf_path}")
        return []

    try:
        loader = PyPDFLoader(pdf_path)
        docs = loader.load()

        cleaned_docs = []
        for doc in docs:
            cleaned_text = clean_text(doc.page_content)

            cleaned_docs.append(
                Document(
                    page_content=cleaned_text,
                    metadata={
                        "page": doc.metadata.get("page", 0),
                        "source": pdf_path
                    }
                )
            )

        print(f"[pdf_loader] Loaded & cleaned {len(cleaned_docs)} pages")
        return cleaned_docs

    except Exception as e:
        print(f"[pdf_loader] Error loading PDF: {e}")
        return []


def get_vectorstore(pdf_path="TRINETRA.pdf"):
    """Create or load vectorstore with better retrieval."""

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # 🔥 Try loading existing DB
    if os.path.exists(VECTORSTORE_PATH):
        try:
            print("[pdf_loader] Loading existing vectorstore...")
            return FAISS.load_local(
                VECTORSTORE_PATH,
                embeddings,
                allow_dangerous_deserialization=True
            )
        except Exception as e:
            print(f"[pdf_loader] Failed loading DB → rebuilding: {e}")

    # 🔥 Build new DB
    docs = load_pdf(pdf_path)

    if not docs:
        print("[pdf_loader] No docs found → using fallback")
        docs = [
            Document(
                page_content="TRINETRA Cyber Defense System documentation.",
                metadata={"page": 0}
            )
        ]

    # 🔥 BETTER SPLITTING (CRITICAL)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=900,      # 🔥 larger chunks
        chunk_overlap=150    # 🔥 preserve context
    )

    chunks = splitter.split_documents(docs)

    print(f"[pdf_loader] Created {len(chunks)} chunks")

    # 🔥 Add chunk IDs (helps debugging + retrieval)
    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_id"] = i

    # 🔥 Create FAISS DB
    vectorstore = FAISS.from_documents(chunks, embeddings)

    vectorstore.save_local(VECTORSTORE_PATH)
    print(f"[pdf_loader] Saved vectorstore → {VECTORSTORE_PATH}")

    return vectorstore