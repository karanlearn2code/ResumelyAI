"""
AI analysis service (free-tier friendly).

AI_PROVIDER in .env picks the engine:
  - "gemini" -> Google Gemini API (free tier, key from https://aistudio.google.com/apikey)
  - "groq"   -> Groq API (free tier, key from https://console.groq.com/keys)
  - "mock"   -> local rule-based demo engine (no key, no network)

Every provider returns the SAME validated `AnalysisResult`, so the frontend
never needs to know which one is active. To add another provider, write one
`_call_xxx` function and register it in PROVIDERS.
"""

from __future__ import annotations

import asyncio
import json
import os
from typing import Any, Awaitable, Callable, Dict, Optional

import httpx
from pydantic import ValidationError

from models.schemas import AnalysisResult
from services.mock_engine import generate_mock_analysis


class AIServiceError(Exception):
    """Raised for any AI failure. The message is safe to show to the user."""


SYSTEM_PROMPT = """You are a resume analysis engine embedded in a web app.
Follow these rules with no exceptions:

1. Never invent experience, skills, achievements, numbers, tools or
   certifications that are not present in the resume text.
2. Only list a skill under "current_skills" if it is explicitly written in
   the resume text.
3. "missing_keywords" and "skill_gaps" may only contain things the job
   description asks for that are genuinely absent from the resume.
4. Base every score on the real overlap between the resume and the job
   description. Do not assign scores randomly, and make ats_feedback.explanation
   explain why the scores were given.
5. ats_score is an estimate, not a guarantee of how any real ATS will score it.
6. Improvement suggestions must only rephrase or reorganize what the candidate
   already wrote. Never add new metrics, tools or claims. "before" must be text
   copied from the resume.
7. Interview questions must only reference technologies or experience present
   in the resume or job description. Questions in the "HR" category may be
   general.
8. Respond with ONLY one valid JSON object that matches the requested schema.
   No markdown fences, no text before or after the JSON.
"""

SCHEMA_HINT = {
    "ats_score": "integer 0-100",
    "job_match_score": "integer 0-100",
    "keyword_match_score": "integer 0-100",
    "skills_match_score": "integer 0-100",
    "matched_keywords": ["string"],
    "missing_keywords": ["string"],
    "partial_keywords": ["string"],
    "current_skills": ["string"],
    "required_skills": ["string"],
    "skill_gaps": [{"skill": "string", "priority": "High Priority | Medium Priority | Low Priority"}],
    "ats_feedback": {
        "formatting": "integer 0-100",
        "keywords": "integer 0-100",
        "structure": "integer 0-100",
        "readability": "integer 0-100",
        "skills": "integer 0-100",
        "explanation": "2-4 sentences explaining the scores",
    },
    "summary_current": "the professional summary exactly as written in the resume, or empty string",
    "summary_improvement": "improved summary using ONLY facts from the resume",
    "project_improvements": [{"title": "string", "before": "text from resume", "after": "improved version"}],
    "experience_improvements": [{"before": "text from resume", "after": "improved version"}],
    "field_readiness_score": "integer 0-100 readiness for the target field",
    "career_recommendations": ["4 short, actionable steps"],
    "recommended_skills": ["skills worth learning for the target field"],
    "interview_questions": [
        {"category": "Technical | Project | HR", "question": "string", "what_is_tested": "string"}
    ],
}


def _build_user_prompt(resume_text: str, job_description: str, target_field: str, custom_field: Optional[str]) -> str:
    field_label = custom_field if target_field == "Other" and custom_field else target_field
    return (
        f"Target career field: {field_label}\n\n"
        f'RESUME TEXT:\n"""\n{resume_text[:10000]}\n"""\n\n'
        f'JOB DESCRIPTION:\n"""\n{job_description[:5000]}\n"""\n\n'
        "Return ONLY a JSON object with exactly this shape (values show the expected type):\n"
        f"{json.dumps(SCHEMA_HINT, indent=2)}\n\n"
        "Give 5-8 interview_questions in total across Technical, Project and HR."
    )


# --------------------------------------------------------------------------
# Provider calls: each returns the raw text the model produced.
# --------------------------------------------------------------------------

async def _call_gemini(system: str, user: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
    if not api_key:
        raise AIServiceError("The server is missing GEMINI_API_KEY. Add it in the backend environment variables.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 8192,
            "responseMimeType": "application/json",
        },
    }
    headers = {"x-goog-api-key": api_key, "content-type": "application/json"}

    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(url, headers=headers, json=payload)
    _raise_for_provider_status(resp, "Gemini")

    data = resp.json()
    try:
        parts = data["candidates"][0]["content"]["parts"]
        return "".join(p.get("text", "") for p in parts)
    except (KeyError, IndexError, TypeError) as exc:
        raise AIServiceError("The AI returned an empty response. Please try again.") from exc


async def _call_groq(system: str, user: str) -> str:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
    if not api_key:
        raise AIServiceError("The server is missing GROQ_API_KEY. Add it in the backend environment variables.")

    payload = {
        "model": model,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    headers = {"Authorization": f"Bearer {api_key}", "content-type": "application/json"}

    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
    _raise_for_provider_status(resp, "Groq")

    try:
        return resp.json()["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise AIServiceError("The AI returned an empty response. Please try again.") from exc


PROVIDERS: Dict[str, Callable[[str, str], Awaitable[str]]] = {
    "gemini": _call_gemini,
    "groq": _call_groq,
}


def _raise_for_provider_status(resp: httpx.Response, name: str) -> None:
    if resp.status_code < 400:
        return
    if resp.status_code == 429:
        raise AIServiceError(
            f"The free {name} quota was reached. Please wait a minute and try again."
        )
    if resp.status_code in (400, 401, 403):
        raise AIServiceError(
            f"{name} rejected the request. Check that the API key and model name are correct."
        )
    raise AIServiceError(f"{name} is temporarily unavailable (error {resp.status_code}). Please try again.")


# --------------------------------------------------------------------------
# Output cleanup: LLMs sometimes return slightly off values. Normalise them so
# validation only fails on genuinely broken responses.
# --------------------------------------------------------------------------

def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise json.JSONDecodeError("No JSON object found", text, 0)
    return json.loads(text[start : end + 1])


def _clamp(value: Any, default: int = 0) -> int:
    try:
        return max(0, min(100, int(round(float(value)))))
    except (TypeError, ValueError):
        return default


def _str_list(value: Any) -> list:
    if not isinstance(value, list):
        return []
    return [str(v).strip() for v in value if str(v).strip()]


def _normalize(raw: dict) -> dict:
    out: Dict[str, Any] = {}

    for key in ("ats_score", "job_match_score", "keyword_match_score", "skills_match_score", "field_readiness_score"):
        out[key] = _clamp(raw.get(key))

    for key in ("matched_keywords", "missing_keywords", "partial_keywords", "current_skills",
                "required_skills", "career_recommendations", "recommended_skills"):
        out[key] = _str_list(raw.get(key))

    fb = raw.get("ats_feedback") if isinstance(raw.get("ats_feedback"), dict) else {}
    out["ats_feedback"] = {
        "formatting": _clamp(fb.get("formatting")),
        "keywords": _clamp(fb.get("keywords")),
        "structure": _clamp(fb.get("structure")),
        "readability": _clamp(fb.get("readability")),
        "skills": _clamp(fb.get("skills")),
        "explanation": str(fb.get("explanation") or "Scores are estimates based on the resume and job description."),
    }

    gaps = []
    for g in raw.get("skill_gaps") or []:
        if isinstance(g, str):
            g = {"skill": g, "priority": "Medium Priority"}
        if not isinstance(g, dict) or not g.get("skill"):
            continue
        p = str(g.get("priority", "")).lower()
        priority = "High Priority" if "high" in p else "Low Priority" if "low" in p else "Medium Priority"
        gaps.append({"skill": str(g["skill"]).strip(), "priority": priority})
    out["skill_gaps"] = gaps

    out["summary_current"] = str(raw.get("summary_current") or "")
    out["summary_improvement"] = str(raw.get("summary_improvement") or "")

    out["project_improvements"] = [
        {"title": str(p.get("title") or "Project description"), "before": str(p.get("before") or ""), "after": str(p.get("after") or "")}
        for p in (raw.get("project_improvements") or [])
        if isinstance(p, dict) and p.get("before") and p.get("after")
    ]
    out["experience_improvements"] = [
        {"before": str(e.get("before")), "after": str(e.get("after"))}
        for e in (raw.get("experience_improvements") or [])
        if isinstance(e, dict) and e.get("before") and e.get("after")
    ]

    questions = []
    for q in raw.get("interview_questions") or []:
        if not isinstance(q, dict) or not q.get("question"):
            continue
        c = str(q.get("category", "")).lower()
        category = "HR" if "hr" in c or "behav" in c or "general" in c else "Project" if "proj" in c else "Technical"
        questions.append({
            "category": category,
            "question": str(q["question"]).strip(),
            "what_is_tested": str(q["what_is_tested"]).strip() if q.get("what_is_tested") else None,
        })
    out["interview_questions"] = questions

    out["is_mock"] = False
    return out


# --------------------------------------------------------------------------
# Public entry point
# --------------------------------------------------------------------------

async def _run_provider(provider: str, resume_text: str, job_description: str,
                        target_field: str, custom_field: Optional[str]) -> AnalysisResult:
    call = PROVIDERS.get(provider)
    if call is None:
        raise AIServiceError(f"Unknown AI_PROVIDER '{provider}'. Use gemini, groq or mock.")

    user_prompt = _build_user_prompt(resume_text, job_description, target_field, custom_field)

    last_error: Exception | None = None
    for attempt in range(2):  # one retry for malformed output / transient network errors
        try:
            text = await call(SYSTEM_PROMPT, user_prompt)
            return AnalysisResult.model_validate(_normalize(_extract_json(text)))
        except AIServiceError:
            raise
        except (json.JSONDecodeError, ValidationError) as exc:
            last_error = exc
        except httpx.HTTPError as exc:
            last_error = exc
        await asyncio.sleep(1.5)

    raise AIServiceError(
        "The AI could not produce a valid analysis this time. Please try again."
    ) from last_error


async def analyze_resume(
    resume_text: str,
    job_description: str,
    target_field: str,
    custom_field: Optional[str] = None,
) -> AnalysisResult:
    provider = os.getenv("AI_PROVIDER", "mock").strip().lower()

    if provider == "mock":
        return generate_mock_analysis(resume_text, job_description, target_field, custom_field)

    try:
        return await _run_provider(provider, resume_text, job_description, target_field, custom_field)
    except AIServiceError:
        # Optional safety net for live demos: show the (clearly labelled) demo
        # analysis instead of an error if the free quota runs out.
        if os.getenv("FALLBACK_TO_MOCK", "false").strip().lower() == "true":
            return generate_mock_analysis(resume_text, job_description, target_field, custom_field)
        raise
