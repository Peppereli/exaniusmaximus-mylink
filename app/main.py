from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import candidates, jobs, match, imports, search

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartMatch API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(candidates.router)
app.include_router(jobs.router)
app.include_router(match.router)
app.include_router(imports.router)
app.include_router(search.router)

@app.get("/healthz")
def healthz():
    return {"status": "ok"}
