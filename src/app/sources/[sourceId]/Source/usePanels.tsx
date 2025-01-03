import { useState } from "react";
import { ClipType } from "@/server/entities/clip/domain/Clip";
import { SuggestionType } from "@/server/entities/suggestion/domain/Suggestion";

export type SelectedPanel = {
  type: "clip" | "suggestion" | "selection" | null,
  id: string | null
  handleSide?: "left" | "right",
  range?: { start: number, end: number },
};

export function usePanels(inputClips: ClipType[], inputSuggestions: SuggestionType[]) {
  const [selection, setSelection] = useState<
    { range: { start: number, end: number } | null, created: boolean }
  >({ range: null, created: false });

  const [clips, setClips] = useState<ClipType[]>(inputClips);
  const [suggestions, setSuggestions] = useState<SuggestionType[]>(inputSuggestions);

  const [selectedPanel, setSelectedPanel] = useState<SelectedPanel>(
    { type: null, id: null, handleSide: undefined, range: undefined }
  );

  function setPanel(type: "clip" | "suggestion" | "selection", id?: string) {
    const panel: SelectedPanel = {
      type,
      id: null,
    };

    if (type === "selection") {
      panel.range = selection.range || undefined;
    }

    if (id) {
      panel.id = id;

      if (type === "clip") {
        const clip = clips.find((clip) => clip.id === id);
        if (clip) {
          panel.range = clip.range;
        }
      }
      else if (type === "suggestion") {
        const suggestion = suggestions.find((suggestion) => suggestion.id === id);
        if (suggestion) {
          panel.range = suggestion.range;
        }
      }
    }

    setSelectedPanel(panel);
  }

  function addHandle(side: "left" | "right") {
    setSelectedPanel({ ...selectedPanel, handleSide: side });
  }

  function startSelection(second: number) {
    const panelIsClipOrSugg = selectedPanel.type !== null && selectedPanel.type !== "selection";
    const selectionExist = selection.range !== null || selection.created;

    if (panelIsClipOrSugg || selectionExist) {
      setSelectedPanel({ type: null, id: null });
      return;
    }

    setSelection({ range: { start: second, end: second }, created: false });
    setSelectedPanel({ type: "selection", id: null });
  }

  function finishSelection() {
    if (selection.created || !selection.range) return;

    if (selection.range.start === selection.range.end) {
      deleteSelection();
      return;
    }

    setSelection({ ...selection, created: true });
    setSelectedPanel({ type: "selection", id: null, range: selection.range });
  }

  function deleteSelection() {
    setSelection({ range: null, created: false });
  }

  function changePanelDuration(second: number) {
    if (selectedPanel.type === "selection") {
      if (!selection.range || (selection.created && !selectedPanel.handleSide)) return;

      if (detectCollision(second)) {
        finishSelection();
        return;
      }

      if (selectedPanel.handleSide) {
        if (selectedPanel.handleSide === "left") {
          setSelection({ range: { start: second, end: selection.range.end }, created: false });
        }
        else {
          setSelection({ range: { start: selection.range.start, end: second }, created: false });
        }
      }
      else {
        if (second <= selection.range.start) {
          setSelection({ range: { start: second, end: selection.range.end }, created: false });
        }
        else {
          setSelection({ range: { start: selection.range.start, end: second }, created: false });
        }
      }
    }

    else if (selectedPanel.type === "clip") {
      if (!selectedPanel.handleSide || !selectedPanel.id) return;

      const clipIndex = clips.findIndex((clip) => clip.id === selectedPanel.id);
      if (clipIndex === -1) return;

      const newClips = [...clips];
      const clip = newClips[clipIndex]!;

      if (selectedPanel.handleSide === "left") {
        clip.range.start = second;
      } else {
        clip.range.end = second;
      }

      setClips(newClips);
    } else if (selectedPanel.type === "suggestion") {
      if (!selectedPanel.handleSide || !selectedPanel.id) return;

      const suggestionIndex = suggestions.findIndex((suggestion) => suggestion.id === selectedPanel.id);
      if (suggestionIndex === -1) return;

      const newSuggestions = [...suggestions];
      const suggestion = newSuggestions[suggestionIndex]!;

      if (selectedPanel.handleSide === "left") {
        suggestion.range.start = second;
      } else {
        suggestion.range.end = second;
      }

      setSuggestions(newSuggestions);
    }
  }

  function detectCollision(endSec: number) {
    if (endSec <= 0) {
      return true;
    }

    if (selection.range && endSec < selection.range.start && endSec > selection.range.end) {
      return true;
    }

    for (const clip of clips) {
      if (endSec > clip.range.start && endSec < clip.range.end) {
        return true;
      }
    }

    for (const suggestion of suggestions) {
      if (endSec > suggestion.range.start && endSec < suggestion.range.end) {
        return true;
      }
    }

    return false;
  }

  function finishPanelDurationChange() {
    if (selectedPanel.type === "selection") {
      finishSelection();
    }
    else {
      setSelectedPanel({ ...selectedPanel, handleSide: undefined });
    }
  }

  return {
    clips,
    suggestions,
    selection,
    setSelection,
    selectedPanel,
    setPanel,
    addHandle,
    startSelection,
    deleteSelection,
    changePanelDuration,
    finishPanelDurationChange,
  };
}
