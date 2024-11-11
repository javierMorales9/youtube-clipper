from sqlalchemy.orm import Session

from models import Suggestion as SuggestionModel
from suggestion.Suggestion import Suggestion


def saveSuggestion(session: Session, suggestion: Suggestion):
    sourceModel = SuggestionModel(
        id=suggestion.id,
        sourceId=suggestion.sourceId,
        name=suggestion.name,
        description=suggestion.description,
        start=suggestion.start,
        end=suggestion.end,
    )
    session.merge(sourceModel)

def saveSuggestions(session: Session, suggestions: list[Suggestion]):
    for suggestion in suggestions:
        saveSuggestion(session, suggestion)
