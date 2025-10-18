# Stub for Telegram chats export (JSON) to automate manual entries.
from typing import Iterable, Dict, List

def load_from_json(items: List[Dict]) -> Iterable[Dict]:
    for it in items:
        it = {**it}
        it.setdefault("source", "telegram_stub")
        yield it
