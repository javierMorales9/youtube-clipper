from typing import Optional
from uuid import uuid4

class Suggestion:
    def __init__ (
        self,
        id: Optional[str],
        companyId: str,
        sourceId: str,
        name: str,
        description: Optional[str],
        start: int,
        end: int,
    ):
        self.id = id if id is not None else str(uuid4())
        self.companyId = companyId
        self.sourceId = sourceId
        self.name = name
        self.description = description
        self.start = start
        self.end = end

    def __repr__(self):
        return f"<Suggestion {self.id} {self.name}>"

