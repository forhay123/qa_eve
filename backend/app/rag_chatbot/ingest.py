import os
import chromadb
import sqlite3
from llama_index.core import Document, VectorStoreIndex
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core.storage.storage_context import StorageContext
from .config import PDF_FOLDER, EMBEDDING_MODEL, CHROMA_DB_DIR
from llama_index.core.readers.file import PDFReader

def build_vector_index():
    os.makedirs(PDF_FOLDER, exist_ok=True)
    os.makedirs(CHROMA_DB_DIR, exist_ok=True)

    print(f"📄 Loading PDFs from: {PDF_FOLDER}")
    documents = []

    # Connect to your database to fetch topic metadata
    conn = sqlite3.connect("backend/app/db.sqlite3")  # Adjust path as needed
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, level, week_number, subject, pdf_url FROM topics")
    topics = cursor.fetchall()

    for topic_id, title, level, week, subject, pdf_url in topics:
        filename = pdf_url.split("/")[-1]
        file_path = os.path.join(PDF_FOLDER, filename)

        if not os.path.exists(file_path):
            print(f"⚠️ Skipping missing file: {file_path}")
            continue

        pdf_docs = PDFReader().load_data(file_path)
        for doc in pdf_docs:
            doc.metadata = {
                "topic_id": topic_id,
                "title": title,
                "level": level,
                "week": week,
                "subject": subject
            }
            documents.append(doc)

    print(f"✅ Loaded {len(documents)} documents")

    embed_model = HuggingFaceEmbedding(model_name=EMBEDDING_MODEL)

    chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    chroma_client.delete_collection("lesson_chunks")
    collection = chroma_client.get_or_create_collection("lesson_chunks")
    vector_store = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    index = VectorStoreIndex.from_documents(
        documents,
        embed_model=embed_model,
        storage_context=storage_context
    )

    print("✅ Ingestion complete.")
    return index

if __name__ == "__main__":
    build_vector_index()
