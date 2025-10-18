from typing import Tuple, Dict, List
from .models import Candidate, Job

def _str_set(s: str | None) -> set[str]:
    if not s:
        return set()
    return {x.strip().lower() for x in s.split(",") if x.strip()}

def score_candidate(candidate: Candidate, job: Job) -> Tuple[float, Dict[str, List[str]]]:
    score = 100.0
    gaps, strengths = [], []

    # Location
    if job.city and candidate.city and job.city.lower() != candidate.city.lower():
        score -= 15
        gaps.append(f"City mismatch: job={job.city}, candidate={candidate.city}")
    elif job.city and candidate.city:
        strengths.append("Same city")

    # Experience
    if candidate.years_experience < job.min_experience:
        delta = job.min_experience - candidate.years_experience
        score -= min(25.0, 10 + delta * 5)
        gaps.append(f"Experience short by {delta:.1f} years")
    else:
        strengths.append("Meets experience")

    # Title keyword (toy rule)
    if job.title and candidate.title:
        if job.title.lower() in candidate.title.lower():
            strengths.append("Title match")
        else:
            score -= 8
            gaps.append("Title mismatch")

    # Education substring
    if job.education and candidate.education:
        if job.education.lower() in candidate.education.lower():
            strengths.append("Education match")
        else:
            score -= 4
            gaps.append("Education mismatch")

    # Languages overlap
    jl = _str_set(job.languages)
    cl = _str_set(candidate.languages)
    if jl:
        common = jl & cl
        if not common:
            score -= 10
            gaps.append(f"No required languages: need {', '.join(sorted(jl))}")
        else:
            strengths.append(f"Languages match: {', '.join(sorted(common))}")

    # Salary
    if candidate.salary_expectation is not None and job.salary_max is not None:
        if candidate.salary_expectation > job.salary_max:
            score -= 10
            gaps.append(f"Salary expectation {candidate.salary_expectation} > max {job.salary_max}")
        else:
            strengths.append("Salary within range")

    # Employment type
    if job.employment_type and candidate.employment_type:
        if job.employment_type.lower() != candidate.employment_type.lower():
            score -= 8
            gaps.append(f"Employment type mismatch: job={job.employment_type}, candidate={candidate.employment_type}")
        else:
            strengths.append("Employment type match")

    score = max(0.0, min(100.0, score))
    return score, {"gaps": gaps, "strengths": strengths}
