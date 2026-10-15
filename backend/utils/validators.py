from __future__ import annotations

from fastapi import HTTPException, UploadFile


class FriendlyError(HTTPException):
    """An HTTPException whose message is meant to be shown to the user as-is."""

    def __init__(self, status_code: int, message: str):
        super().__init__(status_code=status_code, detail=message)


def validate_upload(file: UploadFile, file_bytes: bytes, max_size_mb: int) -> None:
    if file is None or file_bytes is None:
        raise FriendlyError(400, "Please upload a valid PDF resume before continuing.")

    if not file.filename.lower().endswith(".pdf"):
        raise FriendlyError(
            400, "Unsupported file type. Please upload your resume as a PDF."
        )

    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise FriendlyError(
            400, "Unsupported file type. Please upload your resume as a PDF."
        )

    max_bytes = max_size_mb * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise FriendlyError(
            400, f"File too large. Please upload a PDF under {max_size_mb}MB."
        )

    if len(file_bytes) == 0:
        raise FriendlyError(400, "The uploaded file is empty.")


def validate_job_description(job_description: str) -> None:
    if not job_description or len(job_description.strip()) < 20:
        raise FriendlyError(
            400,
            "Please paste a job description (at least a couple of sentences) "
            "before analyzing.",
        )


def validate_target_field(target_field: str, custom_field: str | None) -> None:
    if not target_field:
        raise FriendlyError(400, "Please select a target career field.")
    if target_field == "Other" and not (custom_field and custom_field.strip()):
        raise FriendlyError(400, "Please specify your target career field.")
