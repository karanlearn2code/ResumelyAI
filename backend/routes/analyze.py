from __future__ import annotations

import os

from fastapi import APIRouter, Form, HTTPException, UploadFile, File
from fastapi.responses import PlainTextResponse

from models.schemas import AnalysisResult
from services.ai_service import AIServiceError, analyze_resume
from services.pdf_extractor import ResumeExtractionError, extract_text_from_pdf
from services.report_generator import build_report_text
from utils.validators import (
    FriendlyError,
    validate_job_description,
    validate_target_field,
    validate_upload,
)

router = APIRouter(prefix="/api", tags=["analyze"])

# Simple in-memory cache of the last result per session token so the
# "Download Report" button doesn't need to resend everything.
# (An NTCC-scale app doesn't need Redis for this.)
_last_results: dict[str, tuple[AnalysisResult, str, str | None]] = {}


@router.post("/analyze", response_model=AnalysisResult)
async def analyze(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    target_field: str = Form(...),
    custom_field: str | None = Form(None),
    session_id: str = Form("default"),
):
    max_size_mb = int(os.getenv("MAX_FILE_SIZE_MB", "5"))

    file_bytes = await resume.read()
    validate_upload(resume, file_bytes, max_size_mb)
    validate_job_description(job_description)
    validate_target_field(target_field, custom_field)

    try:
        resume_text = extract_text_from_pdf(file_bytes)
    except ResumeExtractionError as exc:
        raise FriendlyError(422, str(exc)) from exc

    try:
        result = await analyze_resume(resume_text, job_description, target_field, custom_field)
    except AIServiceError as exc:
        raise FriendlyError(502, str(exc)) from exc
    except Exception as exc:
        raise FriendlyError(
            502,
            "The AI analysis service is currently unavailable. Please try again in a moment.",
        ) from exc

    _last_results[session_id] = (result, target_field, custom_field)
    return result


@router.get("/report/{session_id}", response_class=PlainTextResponse)
async def download_report(session_id: str):
    cached = _last_results.get(session_id)
    if not cached:
        raise HTTPException(404, "No analysis found for this session. Please analyze a resume first.")

    result, target_field, custom_field = cached
    text = build_report_text(result, target_field, custom_field)
    return PlainTextResponse(
        content=text,
        headers={"Content-Disposition": "attachment; filename=resumeai_report.txt"},
    )


@router.delete("/session/{session_id}")
async def clear_session(session_id: str):
    _last_results.pop(session_id, None)
    return {"status": "cleared"}
