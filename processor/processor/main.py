from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from models import ProcessingEvent

engine = create_engine("postgresql://user:pass@localhost:5432/db", echo=True)

with Session(engine) as session:
    event = ProcessingEvent(
        id="8ef615b1-488e-4f20-8758-c63078498862",
        sourceId="b3df4acb-6844-4c59-94b4-d11955b8f428",
        type="viva el vino",
        createdAt=datetime.now(),
    )
    session.add(event);
    session.commit()
