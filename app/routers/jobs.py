from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

@router.post("", response_model=schemas.JobOut)
def create_job(payload: schemas.JobIn, db: Session = Depends(get_db)):
    j = models.Job(**payload.model_dump())
    db.add(j); db.commit(); db.refresh(j)
    return j

@router.get("", response_model=list[schemas.JobOut])
def list_jobs(db: Session = Depends(get_db)):
    return db.query(models.Job).order_by(models.Job.id.desc()).all()

@router.get("/{job_id}", response_model=schemas.JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    j = db.get(models.Job, job_id)
    if not j: raise HTTPException(404, "Job not found")
    return j
