from datetime import datetime, timezone

def newDate():
    return datetime.now(timezone.utc)
