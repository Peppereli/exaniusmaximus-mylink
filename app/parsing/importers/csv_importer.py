import csv, io
from typing import Iterable, Dict

EXPECTED = ["name","email","phone","city","years_experience","title","education","languages","salary_expectation","employment_type","resume_text","source"]

def read_candidates_csv(raw_bytes: bytes) -> Iterable[Dict]:
    text = raw_bytes.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(text))
    for row in reader:
        yield {
            "name": row.get("name") or "Unknown",
            "email": row.get("email"),
            "phone": row.get("phone"),
            "city": row.get("city"),
            "years_experience": float(row.get("years_experience") or 0),
            "title": row.get("title"),
            "education": row.get("education"),
            "languages": row.get("languages"),
            "salary_expectation": int(row.get("salary_expectation") or 0) or None,
            "employment_type": row.get("employment_type"),
            "resume_text": row.get("resume_text"),
            "source": row.get("source") or "csv"
        }
