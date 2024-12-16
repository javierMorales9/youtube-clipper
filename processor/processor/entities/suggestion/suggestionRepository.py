from sqlalchemy.orm import Session

from models import Suggestion as SuggestionModel
from entities.suggestion.Suggestion import Suggestion

def saveSuggestion(session: Session, suggestion: Suggestion):
    suggestionModel = SuggestionModel(
        id=suggestion.id,
        companyId=suggestion.companyId,
        sourceId=suggestion.sourceId,
        name=suggestion.name,
        description=suggestion.description,
        start=suggestion.start,
        end=suggestion.end,
    )
    session.merge(suggestionModel)

def saveSuggestions(session: Session, suggestions: list[Suggestion]):
    for suggestion in suggestions:
        saveSuggestion(session, suggestion)
