run:
	uvicorn app.main:app --reload

fmt:
	python -m pip install ruff
	ruff check --fix . || true

db-up:
	docker compose up -d db

migrate:
	alembic revision --autogenerate -m "auto"
	alembic upgrade head

test:
	pytest -q
