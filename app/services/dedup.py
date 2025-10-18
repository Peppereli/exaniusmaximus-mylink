import hashlib

def candidate_fingerprint(name: str, email: str | None, phone: str | None) -> str:
    base = (name or '').strip().lower() + '|' + (email or '').strip().lower() + '|' + (phone or '').strip()
    return hashlib.sha256(base.encode('utf-8')).hexdigest()
