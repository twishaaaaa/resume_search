import os
from pydantic import BaseModel, WithJsonSchema  ## Force Swagger UI to render a multi-file picker instead of an 'array<string>' text box
from chromadb import Client
from fastapi import FastAPI, UploadFile, File
from utils.pdf_parser import extract_text
from utils.metadata_extractor import extract_metadata
from utils.vector_store import vector_store, store_resume
from typing import List, Annotated
from fastapi.middleware.cors import CORSMiddleware

os.makedirs("resumes", exist_ok=True)

SwaggerFile = Annotated[UploadFile, WithJsonSchema({"type": "string", "format":"binary"})]

app = FastAPI()

#connection(frontend and backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"], # Allows POST, GET, OPTIONS, etc.
    allow_headers=["*"],
)

# Save PDF
@app.post("/upload")
async def upload_resume(files: Annotated[List[SwaggerFile], File()]):
    upload_files = []
    for file in files:
        file_path = f"resumes/{file.filename}"

        with open(file_path, "wb") as f:
            f.write(await file.read())

        text = extract_text(file_path)
        print("Path:", file_path)
        print("Size:", os.path.getsize(file_path))
        
        metadata = extract_metadata(text)
        print("Metadata:",metadata)
        
        store_resume(
            text=text,
            metadata=metadata,
            resume_id=file.filename
        )
        upload_files.append(file.filename)
        
        metadata = extract_metadata(text)
        metadata["filename"] = file.filename
        
    return {
        "message": "Files uploaded successfully",
        "files": upload_files
    }

# Filtering
class SearchRequest(BaseModel):
    query: str
    min_experience: int = 0
    location: str = ""
    skills: List[str] = [""]

@app.post("/search")
def search_resumes(request: SearchRequest):

    docs_with_scores = vector_store.similarity_search_with_score(query=request.query, k=10)    

    filtered = []
    seen_candidates = set()

    # Loop through LangChain Document objects
    for doc,raw_score in docs_with_scores:
        metadata = doc.metadata
        resume_text = doc.page_content  # Access raw text directly from the document object

        similarity_score = 1.0 / (1.0 + raw_score)

        candidate_id = metadata.get("filename") or metadata.get("name") or resume_text[:50]
        if candidate_id in seen_candidates:
            continue

        # 1. Experience Check
        if int(metadata.get("experience", 0)) < request.min_experience:
            continue
            
        # 2. Location Check
        if request.location:
            if request.location.strip().lower() not in metadata.get("location", "").strip().lower():
                continue

        # 3. Skills Validation
        requested_skills = [s.strip().lower() for s in request.skills if s.strip()]
        if requested_skills:
            if not all(skill in resume_text.lower() for skill in requested_skills):
                continue

        metadata["score"] = similarity_score
            
        # Append matched metadata tracking your format
        filtered.append(metadata)
        seen_candidates.add(candidate_id)

    return filtered

@app.get("/count")
def count_resumes():
    return {
        "count": vector_store._collection.count()
    }
@app.get("/debug")
def debug():
    return vector_store._collection.get()