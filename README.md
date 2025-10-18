# SmartMatch API (Backend-only)

**Stack:** FastAPI + SQLAlchemy + Alembic + Postgres

## Quickstart (local)
1) Create `.env` from `.env.example` and set `DATABASE_URL`.
2) Start Postgres (e.g., `make db-up` or your local instance).
3) Run migrations:
   ```bash
   alembic revision --autogenerate -m "init"
   alembic upgrade head
   ```
4) Launch API:
   ```bash
   make run
   ```
5) Open docs: http://localhost:8000/docs

## Endpoints Overview
- `POST /api/jobs` / `GET /api/jobs`
- `POST /api/candidates` / `GET /api/candidates`
- `POST /api/match/{job_id}/{candidate_id}` — returns score, gaps/strengths, insights.
- Imports:
  - `POST /api/imports/candidates/csv` (file upload)
  - `POST /api/imports/candidates/hh` (JSON list)
  - `POST /api/imports/candidates/linkedin` (JSON list)
  - `POST /api/imports/candidates/telegram` (JSON list)
- Search:
  - `GET /api/search/candidates?q=python&city=Almaty`
  - `GET /api/search/jobs?q=react&city=Astana`

## Automating External Sources
For hackathon scope we accept JSON lists from HH/LinkedIn/Telegram exports. You can later swap stubs to real API clients without changing routes.

## Matching Logic (baseline)
Deterministic scoring with penalties for mismatches (location, experience, title, education, languages, salary, employment type). Add ML later if needed.

## Suggestions
- Candidate: resume improvements (heuristic).
- Company: offer improvements.
- Likely rejection reasons mapped from gaps.

## Testing
- Add your tests in `tests/`. Run `pytest`.

## Docker
```bash
docker compose up --build
# API on http://localhost:8000
```
