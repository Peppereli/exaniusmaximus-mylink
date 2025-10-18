def resume_suggestions(resume_text: str) -> list[str]:
    suggestions = []
    if not resume_text or len(resume_text.split()) < 120:
        suggestions.append("Expand with 3–5 bullet points per job including metrics (%, $, time).")
    if resume_text and "responsible for" in resume_text.lower():
        suggestions.append("Replace 'responsible for' with strong action verbs and outcomes.")
    suggestions.append("Add a 'Skills' section with tools and languages mentioned in the job description.")
    return suggestions

def employer_offer_suggestions(job_desc: str | None) -> list[str]:
    base = [
        "Publish salary range and bonus/ESOP policy.",
        "Describe growth path, mentorship, and learning budget.",
        "Mention work mode (remote/hybrid) and flexible hours if possible.",
        "State tech stack and interview process clearly."
    ]
    return base

def likely_rejection_reasons(gaps: list[str]) -> list[str]:
    reasons = []
    for g in gaps:
        l = g.lower()
        if "experience" in l and "short" in l:
            reasons.append("Insufficient relevant experience")
        if "language" in l and "required" in l:
            reasons.append("Missing required language/skill")
        if "salary" in l and ">" in l:
            reasons.append("Salary expectations above budget")
        if "location" in l or "city mismatch" in l:
            reasons.append("Location/relocation constraints")
    return reasons or ["A stronger profile was selected"]
