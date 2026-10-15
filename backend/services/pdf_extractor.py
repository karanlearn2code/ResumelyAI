"""
PDF text extraction for uploaded resumes.

Uses pdfplumber to pull raw text out of a PDF. Raises ResumeExtractionError
(a plain, catchable exception) for anything that goes wrong so the route
layer can turn it into a friendly HTTP error instead of a stack trace.
"""

from __future__ import annotations

import io

import pdfplumber


class ResumeExtractionError(Exception):
    """Raised when a resume PDF cannot be read or has no usable text."""


def extract_text_from_pdf(file_bytes: bytes) -> str:
    if not file_bytes:
        raise ResumeExtractionError("The uploaded file is empty.")

    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            if len(pdf.pages) == 0:
                raise ResumeExtractionError("The PDF has no pages.")

            pages_text = []
            for page in pdf.pages:
                text = page.extract_text() or ""
                pages_text.append(text)

            full_text = "\n".join(pages_text).strip()
    except ResumeExtractionError:
        raise
    except Exception as exc:  # pdfplumber / pdfminer can raise many types
        raise ResumeExtractionError(
            "This file could not be read as a PDF. It may be corrupted, "
            "password protected, or not a real PDF."
        ) from exc

    if len(full_text) < 40:
        raise ResumeExtractionError(
            "No readable text was found in this PDF. It may be a scanned "
            "image without a text layer. Please upload a text-based PDF."
        )

    return full_text
