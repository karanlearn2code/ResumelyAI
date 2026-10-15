"""
Pydantic schemas shared across the ResumeAI backend.

These models define the STRICT structured contract that the AI layer
must return. The frontend is built against this shape and nothing else,
so the AI service (mock or real) always validates its output against
`AnalysisResult` before it is sent back to the client.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class TargetField(str, Enum):
    data_analyst = "Data Analyst"
    data_scientist = "Data Scientist"
    python_developer = "Python Developer"
    web_developer = "Web Developer"
    software_developer = "Software Developer"
    other = "Other"


class Priority(str, Enum):
    high = "High Priority"
    medium = "Medium Priority"
    low = "Low Priority"


class QuestionCategory(str, Enum):
    technical = "Technical"
    project = "Project"
    hr = "HR"


class AnalyzeRequest(BaseModel):
    target_field: str
    custom_field: Optional[str] = None
    job_description: str = Field(..., min_length=20)


class ATSFeedback(BaseModel):
    formatting: int = Field(ge=0, le=100)
    keywords: int = Field(ge=0, le=100)
    structure: int = Field(ge=0, le=100)
    readability: int = Field(ge=0, le=100)
    skills: int = Field(ge=0, le=100)
    explanation: str


class SkillGapItem(BaseModel):
    skill: str
    priority: Priority


class ExperienceImprovement(BaseModel):
    before: str
    after: str


class ProjectImprovement(BaseModel):
    title: str
    before: str
    after: str


class InterviewQuestion(BaseModel):
    category: QuestionCategory
    question: str
    what_is_tested: Optional[str] = None


class AnalysisResult(BaseModel):
    ats_score: int = Field(ge=0, le=100)
    job_match_score: int = Field(ge=0, le=100)
    keyword_match_score: int = Field(ge=0, le=100)
    skills_match_score: int = Field(ge=0, le=100)

    matched_keywords: List[str] = []
    missing_keywords: List[str] = []
    partial_keywords: List[str] = []

    current_skills: List[str] = []
    required_skills: List[str] = []
    skill_gaps: List[SkillGapItem] = []

    ats_feedback: ATSFeedback

    summary_current: str = ""
    summary_improvement: str = ""

    project_improvements: List[ProjectImprovement] = []
    experience_improvements: List[ExperienceImprovement] = []

    field_readiness_score: int = Field(ge=0, le=100, default=0)
    career_recommendations: List[str] = []
    recommended_skills: List[str] = []

    interview_questions: List[InterviewQuestion] = []

    is_mock: bool = False
