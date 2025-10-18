from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("/candidates", response_model=list[schemas.CandidateOut])
def search_candidates(q: str = Query(""), city: str | None = None, db: Session = Depends(get_db)):
    stmt = select(models.Candidate)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(or_(models.Candidate.title.ilike(like), models.Candidate.resume_text.ilike(like), models.Candidate.languages.ilike(like)))
    if city:
        stmt = stmt.where(models.Candidate.city.ilike(f"%{city}%"))
    res = db.execute(stmt).scalars().all()
    return res

@router.get("/jobs", response_model=list[schemas.JobOut])
def search_jobs(q: str = Query(""), city: str | None = None, db: Session = Depends(get_db)):
    stmt = select(models.Job)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(or_(models.Job.title.ilike(like), models.Job.description.ilike(like), models.Job.languages.ilike(like)))
    if city:
        stmt = stmt.where(models.Job.city.ilike(f"%{city}%"))
    res = db.execute(stmt).scalars().all()
    return res
