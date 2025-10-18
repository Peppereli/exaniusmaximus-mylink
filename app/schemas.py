from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, List

class CandidateIn(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    years_experience: float = 0
    title: Optional[str] = None
    education: Optional[str] = None
    languages: Optional[str] = None
    salary_expectation: Optional[int] = None
    employment_type: Optional[str] = None
    resume_text: Optional[str] = None
    source: Optional[str] = None
    metadata_json: Dict[str, Any] | None = None

class CandidateOut(CandidateIn):
    id: int

class JobIn(BaseModel):
    company: str
    city: Optional[str] = None
    min_experience: float = 0
    title: Optional[str] = None
    education: Optional[str] = None
    languages: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    employment_type: Optional[str] = None
    description: Optional[str] = None
    criteria_json: Dict[str, Any] | None = None

class JobOut(JobIn):
    id: int

class MatchOut(BaseModel):
    candidate: CandidateOut
    job: JobOut
    score: float = Field(ge=0, le=100)
    reasons: Dict[str, List[str]]
    insights: Dict[str, Any] | None = None
