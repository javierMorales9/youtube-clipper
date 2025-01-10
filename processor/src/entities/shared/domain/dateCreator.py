from typing import Protocol
from datetime import datetime

class DateCreator(Protocol):
    def newDate(self) -> datetime: ...
