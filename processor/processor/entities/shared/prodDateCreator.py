from datetime import datetime, timezone

class ProdDateCreator():
    def newDate(self):
        return datetime.now(timezone.utc)
