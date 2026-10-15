from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routes.analyze import router as analyze_router  # noqa: E402

app = FastAPI(
    title="ResumeAI API",
    description="AI Resume Analyzer & Career Improvement backend",
    version="1.0.0",
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

# Optional: also allow Vercel preview deployments, e.g. https://resumeai-.*\.vercel\.app
origin_regex = os.getenv("ALLOWED_ORIGIN_REGEX", "").strip() or None

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins if o.strip()],
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "ResumeAI API"}


@app.get("/api/health")
async def health():
    provider = os.getenv("AI_PROVIDER", "mock").strip().lower()
    return {
        "status": "ok",
        "ai_provider": provider,
        "mock_mode": provider == "mock",
    }
