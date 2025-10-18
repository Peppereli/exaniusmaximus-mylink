from app.matching import score_candidate
from types import SimpleNamespace as NS

def test_score_basic():
    c = NS(city="Almaty", years_experience=3, title="Frontend Developer", education="Bachelor", languages="ru,en", salary_expectation=600000, employment_type="full-time")
    j = NS(city="Almaty", min_experience=2, title="Frontend Developer", education="Bachelor", languages="ru,en", salary_min=400000, salary_max=700000, employment_type="full-time")
    score, reasons = score_candidate(c, j)
    assert score == 100.0
    assert "Languages match: en, ru" in "; ".join(reasons["strengths"]) or "Languages match: ru, en" in "; ".join(reasons["strengths"])
