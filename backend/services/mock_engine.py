"""
Deterministic "mock AI" analysis engine.

This does NOT call any external LLM. It is a rule-based / keyword-matching
engine so the whole app can be demoed with zero API key and zero cost,
while still only ever reporting things that are actually present in the
resume text and job description (never inventing skills, numbers, or
experience).
"""

from __future__ import annotations

import re
from collections import OrderedDict
from typing import Dict, List

from models.schemas import (
    AnalysisResult,
    ATSFeedback,
    ExperienceImprovement,
    InterviewQuestion,
    ProjectImprovement,
    SkillGapItem,
)

# A broad, general-purpose library of common tech/skill keywords.
# Real matching only ever reports a skill if it is literally found in the text.
SKILL_LIBRARY = [
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "SQL", "NoSQL",
    "R", "Go", "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "PyTorch",
    "Power BI", "Tableau", "Excel", "Statistics", "Machine Learning",
    "Deep Learning", "Data Visualization", "Data Analysis", "React",
    "Angular", "Vue", "Node.js", "Express", "Django", "Flask", "FastAPI",
    "HTML", "CSS", "Tailwind", "Bootstrap", "REST API", "GraphQL",
    "Git", "GitHub", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
    "MongoDB", "PostgreSQL", "MySQL", "SQLite", "Linux", "CI/CD",
    "Agile", "Scrum", "Jira", "Data Structures", "Algorithms",
    "Communication", "Leadership", "Problem Solving", "Testing",
    "Unit Testing", "Selenium", "Spark", "Hadoop", "ETL", "Airflow",
]

FIELD_CORE_SKILLS: Dict[str, List[str]] = {
    "Data Analyst": ["SQL", "Excel", "Power BI", "Tableau", "Statistics", "Python", "Pandas", "Data Visualization"],
    "Data Scientist": ["Python", "Statistics", "Machine Learning", "Pandas", "NumPy", "Scikit-learn", "SQL", "Deep Learning"],
    "Python Developer": ["Python", "Django", "Flask", "FastAPI", "SQL", "Git", "REST API", "Testing"],
    "Web Developer": ["HTML", "CSS", "JavaScript", "React", "Node.js", "Git", "REST API", "Tailwind"],
    "Software Developer": ["Java", "Python", "Data Structures", "Algorithms", "Git", "SQL", "REST API", "Testing"],
}


def _find_keywords_in_text(text: str, library: List[str]) -> List[str]:
    found = []
    lowered = text.lower()
    for kw in library:
        pattern = r"(?<![a-zA-Z0-9])" + re.escape(kw.lower()).replace(r"\ ", r"[\s\-]?") + r"(?![a-zA-Z0-9])"
        if re.search(pattern, lowered):
            found.append(kw)
    return found


def _extract_bullets(resume_text: str, limit: int = 4) -> List[str]:
    """Only pull lines that were ACTUALLY written as bullet points in the
    resume (start with -, •, *, or a number like '1.'), so we never treat a
    summary line or a skills list as an "experience bullet"."""
    bullets = []
    for raw_line in resume_text.splitlines():
        stripped = raw_line.strip()
        if re.match(r"^([\-•\*]|\d+[\.\)])\s+", stripped):
            cleaned = re.sub(r"^([\-•\*]|\d+[\.\)])\s+", "", stripped).strip()
            if 20 <= len(cleaned) <= 220:
                bullets.append(cleaned)

    seen = OrderedDict()
    for b in bullets:
        seen[b] = None
    return list(seen.keys())[:limit]


def _extract_summary(resume_text: str) -> str:
    lowered = resume_text.lower()
    for anchor in ["summary", "objective", "profile"]:
        idx = lowered.find(anchor)
        if idx != -1:
            snippet = resume_text[idx: idx + 400]
            snippet = snippet.split("\n\n")[0]
            cleaned = re.sub(r"\s+", " ", snippet).strip()
            if len(cleaned) > 20:
                return cleaned
    # fallback: first non-empty block of the resume
    first_block = resume_text.strip().split("\n\n")[0]
    return re.sub(r"\s+", " ", first_block).strip()[:400]


def _strengthen_bullet(bullet: str, resume_skills: List[str]) -> str:
    """Rephrase a bullet to be more action-oriented, using ONLY words/skills
    already present in the resume. Never adds invented numbers or claims."""
    action_verbs = ["Built", "Developed", "Implemented", "Designed", "Automated", "Analyzed"]
    starts_with_verb = bullet.split(" ")[0][:-1].lower() in [v.lower() for v in action_verbs] or bullet[0:1].isupper()

    mentioned_skills = [s for s in resume_skills if s.lower() in bullet.lower()]
    tail = ""
    if mentioned_skills and not any(s.lower() in bullet.lower()[-40:] for s in mentioned_skills):
        tail = f" using {', '.join(mentioned_skills[:2])}"

    cleaned = bullet.rstrip(".")
    if not starts_with_verb:
        cleaned = "Delivered: " + cleaned

    suggestion = cleaned + (tail if tail and tail.strip("using , ") else "")
    suggestion = suggestion.strip()
    if not suggestion.endswith("."):
        suggestion += "."
    return suggestion


def _priority_for(skill: str, required_skills: List[str]) -> SkillGapItem:
    # Core, high-signal tools get flagged as higher priority than soft/general ones.
    high_priority = {"SQL", "Power BI", "Python", "Machine Learning", "React", "Statistics"}
    medium_priority = {"Tableau", "Excel", "JavaScript", "Django", "AWS", "Docker"}
    if skill in high_priority:
        p = "High Priority"
    elif skill in medium_priority:
        p = "Medium Priority"
    else:
        p = "Low Priority"
    return SkillGapItem(skill=skill, priority=p)


def generate_mock_analysis(
    resume_text: str,
    job_description: str,
    target_field: str,
    custom_field: str | None = None,
) -> AnalysisResult:
    field_label = custom_field if target_field == "Other" and custom_field else target_field

    resume_skills = _find_keywords_in_text(resume_text, SKILL_LIBRARY)
    jd_skills = _find_keywords_in_text(job_description, SKILL_LIBRARY)

    core_required = FIELD_CORE_SKILLS.get(target_field, [])
    required_skills = sorted(set(jd_skills) | set(core_required))

    matched = sorted(set(resume_skills) & set(jd_skills))
    missing = sorted(set(jd_skills) - set(resume_skills))

    # "partial" = related/adjacent skill families where resume has one member
    # of a family the JD asks for another member of (e.g. has ML, JD wants DL)
    adjacency = [
        {"Machine Learning", "Deep Learning", "Data Visualization"},
        {"SQL", "NoSQL", "PostgreSQL", "MySQL"},
        {"React", "Angular", "Vue"},
        {"AWS", "Azure", "GCP"},
    ]
    partial = []
    for group in adjacency:
        has_resume = group & set(resume_skills)
        needs_jd = group & set(jd_skills)
        if has_resume and needs_jd and has_resume != needs_jd:
            partial.extend(sorted(needs_jd - has_resume))
    partial = sorted(set(partial) - set(matched) - set(missing[:0]))
    missing = [m for m in missing if m not in partial]

    keyword_match_score = (
        round(100 * len(matched) / len(jd_skills)) if jd_skills else 60
    )
    skills_required_for_score = required_skills or jd_skills
    skills_match_score = (
        round(100 * len(set(resume_skills) & set(skills_required_for_score)) / len(skills_required_for_score))
        if skills_required_for_score else 60
    )

    word_count = len(resume_text.split())
    has_bullets = bool(re.search(r"^[\-•\*]", resume_text, re.MULTILINE))
    has_section_headers = bool(
        re.search(r"\b(experience|education|projects|skills)\b", resume_text, re.IGNORECASE)
    )

    formatting = 90 if has_bullets else 70
    structure = 90 if has_section_headers else 65
    readability = 85 if 150 <= word_count <= 900 else 65
    keywords_component = keyword_match_score
    skills_component = skills_match_score

    ats_score = round(
        0.2 * formatting + 0.3 * keywords_component + 0.2 * structure
        + 0.15 * readability + 0.15 * skills_component
    )
    job_match_score = round(0.5 * keyword_match_score + 0.5 * skills_match_score)

    explanation_parts = []
    explanation_parts.append(
        f"Formatting scored {formatting}% based on the presence of bullet points and clear structure."
    )
    explanation_parts.append(
        f"Keyword alignment scored {keywords_component}% from {len(matched)} of "
        f"{len(jd_skills) if jd_skills else 'the'} job description keywords found in the resume."
    )
    explanation_parts.append(
        f"Section structure scored {structure}% based on standard resume sections being present."
    )
    explanation = " ".join(explanation_parts) + (
        " This is an estimate only, not a guarantee of how a real company's ATS will score this resume."
    )

    ats_feedback = ATSFeedback(
        formatting=formatting,
        keywords=keywords_component,
        structure=structure,
        readability=readability,
        skills=skills_component,
        explanation=explanation,
    )

    skill_gaps = [_priority_for(s, required_skills) for s in (missing + partial)][:6]

    current_summary = _extract_summary(resume_text)
    if missing:
        summary_improvement = (
            current_summary.rstrip(".")
            + f", with hands-on experience in {', '.join(resume_skills[:3])}."
            if resume_skills else current_summary
        )
    else:
        summary_improvement = current_summary

    bullets = _extract_bullets(resume_text)
    experience_improvements = [
        ExperienceImprovement(before=b, after=_strengthen_bullet(b, resume_skills))
        for b in bullets
    ]

    project_improvements = []
    project_idx = resume_text.lower().find("project")
    if project_idx != -1:
        snippet = re.sub(r"\s+", " ", resume_text[project_idx: project_idx + 220]).strip()
        project_improvements.append(
            ProjectImprovement(
                title="Project description",
                before=snippet,
                after=(
                    "Rewrite this as: what you built, which tools from your resume you used "
                    f"({', '.join(resume_skills[:3]) or 'the tools you listed'}), and what outcome "
                    "you observed. Only add a metric if you actually measured one."
                ),
            )
        )

    readiness = skills_match_score
    recommended_skills = [s for s in core_required if s not in resume_skills][:6] or core_required[:6]
    career_recommendations = []
    for s in (missing + partial)[:3]:
        career_recommendations.append(f"Learn or strengthen {s}, which this job description emphasizes.")
    if bullets:
        career_recommendations.append("Quantify your existing bullet points with real metrics where you have them.")
    if not any("project" in c.lower() for c in career_recommendations) and field_label:
        career_recommendations.append(f"Build one portfolio project clearly aligned with the {field_label} role.")
    career_recommendations = career_recommendations[:4]

    interview_questions: List[InterviewQuestion] = []
    for s in resume_skills[:3]:
        interview_questions.append(
            InterviewQuestion(
                category="Technical",
                question=f"Can you walk me through how you used {s} in your work?",
                what_is_tested=f"Depth of real, hands-on experience with {s}.",
            )
        )
    if bullets:
        interview_questions.append(
            InterviewQuestion(
                category="Project",
                question=f"Tell me more about this: \"{bullets[0][:90]}\" — what was your specific role?",
                what_is_tested="Ability to speak concretely about listed experience.",
            )
        )
    for s in missing[:2]:
        interview_questions.append(
            InterviewQuestion(
                category="Technical",
                question=f"This role uses {s}, which isn't on your resume yet — how would you approach learning it quickly?",
                what_is_tested="Growth mindset and learning agility for a known gap.",
            )
        )
    interview_questions.extend([
        InterviewQuestion(
            category="HR",
            question="Why are you interested in this particular role?",
            what_is_tested="Motivation and genuine interest in the position (general question).",
        ),
        InterviewQuestion(
            category="HR",
            question="Tell me about a challenge you faced and how you handled it.",
            what_is_tested="Communication and problem-solving approach (general question).",
        ),
    ])

    return AnalysisResult(
        ats_score=ats_score,
        job_match_score=job_match_score,
        keyword_match_score=keyword_match_score,
        skills_match_score=skills_match_score,
        matched_keywords=matched,
        missing_keywords=missing,
        partial_keywords=partial,
        current_skills=resume_skills,
        required_skills=required_skills,
        skill_gaps=skill_gaps,
        ats_feedback=ats_feedback,
        summary_current=current_summary,
        summary_improvement=summary_improvement,
        project_improvements=project_improvements,
        experience_improvements=experience_improvements,
        field_readiness_score=readiness,
        career_recommendations=career_recommendations,
        recommended_skills=recommended_skills,
        interview_questions=interview_questions,
        is_mock=True,
    )
