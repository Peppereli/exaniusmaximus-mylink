# Stub for HeadHunter/other boards integration.
# In production, implement OAuth + API polling or inbox parsing.
# Here we accept a JSON list payload to bulk-insert candidates.
from typing import Iterable, Dict, List

def load_from_json(items: List[Dict]) -> Iterable[Dict]:
    for it in items:
        it = {**it}
        it.setdefault("source", "hh_stub")
        yield it
