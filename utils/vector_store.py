from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

embedding_model = HuggingFaceEmbeddings(model_name="all-miniLM-L6-v2")

vector_store = Chroma(
    collection_name="resumes",
    embedding_function=embedding_model,
    persist_directory="chroma_db"
)

def store_resume(text,metadata,resume_id):
    #packed in document
        doc = Document(
            page_content=text,
            metadata=metadata,
            id=resume_id
        )

        vector_store.add_documents([doc])       #generates the embeddingd and save them automatically