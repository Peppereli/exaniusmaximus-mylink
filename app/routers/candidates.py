from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/candidates", tags=["candidates"])

@router.post("", response_model=schemas.CandidateOut)
def create_candidate(payload: schemas.CandidateIn, db: Session = Depends(get_db)):
    c = models.Candidate(**payload.model_dump())
    db.add(c); db.commit(); db.refresh(c)
    return c

@router.get("", response_model=list[schemas.CandidateOut])
def list_candidates(db: Session = Depends(get_db)):
    return db.query(models.Candidate).order_by(models.Candidate.id.desc()).all()

@router.get("/{candidate_id}", response_model=schemas.CandidateOut)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    c = db.get(models.Candidate, candidate_id)
    if not c: raise HTTPException(404, "Candidate not found")
    return c
