from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Float, JSON, ForeignKey
from .database import Base

class Candidate(Base):
    __tablename__ = "candidates"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255), index=True)
    phone: Mapped[str | None] = mapped_column(String(64))
    city: Mapped[str | None] = mapped_column(String(128))
    years_experience: Mapped[float] = mapped_column(default=0.0)
    title: Mapped[str | None] = mapped_column(String(255))
    education: Mapped[str | None] = mapped_column(String(255))
    languages: Mapped[str | None] = mapped_column(String(255))
    salary_expectation: Mapped[int | None]
    employment_type: Mapped[str | None]
    resume_text: Mapped[str | None]
    source: Mapped[str | None]
    metadata_json: Mapped[dict | None] = mapped_column(JSON, default={})

class Job(Base):
    __tablename__ = "jobs"
    id: Mapped[int] = mapped_column(primary_key=True)
    company: Mapped[str] = mapped_column(String(255))
    city: Mapped[str | None] = mapped_column(String(128))
    min_experience: Mapped[float] = mapped_column(default=0.0)
    title: Mapped[str | None] = mapped_column(String(255))
    education: Mapped[str | None] = mapped_column(String(255))
    languages: Mapped[str | None] = mapped_column(String(255))
    salary_min: Mapped[int | None]
    salary_max: Mapped[int | None]
    employment_type: Mapped[str | None]
    description: Mapped[str | None]
    criteria_json: Mapped[dict | None] = mapped_column(JSON, default={})

class Match(Base):
    __tablename__ = "matches"
    id: Mapped[int] = mapped_column(primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id", ondelete="CASCADE"))
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"))
    score: Mapped[float]
    reasons: Mapped[dict] = mapped_column(JSON)
    insights: Mapped[dict | None] = mapped_column(JSON, default=None)
