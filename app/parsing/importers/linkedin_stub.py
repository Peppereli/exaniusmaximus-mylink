# Stub for LinkedIn or other sources. Accepts JSON list of profiles.
from typing import Iterable, Dict, List

def load_from_json(items: List[Dict]) -> Iterable[Dict]:
    for it in items:
        it = {**it}
        it.setdefault("source", "linkedin_stub")
        yield it
