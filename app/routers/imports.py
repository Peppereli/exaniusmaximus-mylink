from fastapi import APIRouter, Depends, UploadFile, File, Body
from sqlalchemy.orm import Session
from typing import List, Dict
from ..database import get_db
from .. import models, schemas
from ..parsing.importers.csv_importer import read_candidates_csv
from ..parsing.importers.hh_stub import load_from_json as hh_load
from ..parsing.importers.linkedin_stub import load_from_json as li_load
from ..parsing.importers.telegram_stub import load_from_json as tg_load

router = APIRouter(prefix="/api/imports", tags=["imports"])

@router.post("/candidates/csv", response_model=list[schemas.CandidateOut])
async def import_candidates_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    raw = await file.read()
    created = []
    for data in read_candidates_csv(raw):
        c = models.Candidate(**data)
        db.add(c)
        created.append(c)
    db.commit()
    for c in created: db.refresh(c)
    return created

@router.post("/candidates/hh", response_model=list[schemas.CandidateOut])
def import_candidates_hh(items: List[Dict] = Body(...), db: Session = Depends(get_db)):
    created = []
    for data in hh_load(items):
        c = models.Candidate(**data); db.add(c); created.append(c)
    db.commit()
    for c in created: db.refresh(c)
    return created

@router.post("/candidates/linkedin", response_model=list[schemas.CandidateOut])
def import_candidates_linkedin(items: List[Dict] = Body(...), db: Session = Depends(get_db)):
    created = []
    for data in li_load(items):
        c = models.Candidate(**data); db.add(c); created.append(c)
    db.commit()
    for c in created: db.refresh(c)
    return created

@router.post("/candidates/telegram", response_model=list[schemas.CandidateOut])
def import_candidates_telegram(items: List[Dict] = Body(...), db: Session = Depends(get_db)):
    created = []
    for data in tg_load(items):
        c = models.Candidate(**data); db.add(c); created.append(c)
    db.commit()
    for c in created: db.refresh(c)
    return created
