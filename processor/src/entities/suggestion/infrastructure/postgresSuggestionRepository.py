from sqlalchemy.orm import Session

from models import Suggestion as SuggestionModel
from entities.suggestion.domain.Suggestion import Suggestion

class PostgresSuggestionRepository():
    def __init__(
        self,
        session: Session,
    ):
        self.session = session

    def saveSuggestion(self, suggestion: Suggestion):
        suggestionModel = SuggestionModel(
            id=suggestion.id,
            companyId=suggestion.companyId,
            sourceId=suggestion.sourceId,
            name=suggestion.name,
            description=suggestion.description,
            start=suggestion.start,
            end=suggestion.end,
        )
        self.session.merge(suggestionModel)

    def saveSuggestions(self, suggestions: list[Suggestion]):
        for suggestion in suggestions:
            self.saveSuggestion(suggestion)


