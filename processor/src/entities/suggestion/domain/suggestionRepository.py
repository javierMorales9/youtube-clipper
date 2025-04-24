from typing import Protocol

from entities.suggestion.domain.Suggestion import Suggestion

class SuggestionRepository(Protocol):
    def saveSuggestion(self, suggestion: Suggestion): ...
    def saveSuggestions(self, suggestions: list[Suggestion]): ...
