from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..matching import score_candidate
from ..services.suggestions import resume_suggestions, employer_offer_suggestions, likely_rejection_reasons

router = APIRouter(prefix="/api/match", tags=["match"])

@router.post("/{job_id}/{candidate_id}", response_model=schemas.MatchOut)
def match(job_id: int, candidate_id: int, db: Session = Depends(get_db)):
    cand = db.get(models.Candidate, candidate_id)
    job = db.get(models.Job, job_id)
    if not cand or not job:
        raise HTTPException(404, "Job or Candidate not found")
    score, reasons = score_candidate(cand, job)

    insights = {
        "resume_suggestions": resume_suggestions(cand.resume_text or ""),
        "offer_suggestions": employer_offer_suggestions(job.description or ""),
        "likely_rejection_reasons": likely_rejection_reasons(reasons["gaps"]),
    }

    m = models.Match(candidate_id=cand.id, job_id=job.id, score=score, reasons=reasons, insights=insights)
    db.add(m); db.commit(); db.refresh(m)

    return schemas.MatchOut(
        candidate=schemas.CandidateOut(**{k: getattr(cand, k) for k in schemas.CandidateOut.model_fields.keys()}),
        job=schemas.JobOut(**{k: getattr(job, k) for k in schemas.JobOut.model_fields.keys()}),
        score=score,
        reasons=reasons,
        insights=insights
    )
