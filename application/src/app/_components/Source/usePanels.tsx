import { useState } from "react";
import { ClipType } from "@/server/entities/clip/domain/Clip";
import { SuggestionType } from "@/server/entities/suggestion/domain/Suggestion";

export type SelectedBlock = {
  type: "clip" | "suggestion" | "selection" | null,
  id: string | null
  handleSide?: "left" | "right",
  range?: { start: number, end: number },
  editable?: boolean,
};

export function useBlocks(inputClips: ClipType[], inputSuggestions: SuggestionType[]) {
  const [selection, setSelection] = useState<
    { range: { start: number, end: number } | null, created: boolean }
  >({ range: null, created: false });

  const [clips, setClips] = useState<ClipType[]>(inputClips);
  const [suggestions, setSuggestions] = useState<SuggestionType[]>(inputSuggestions);

  const [selectedBlock, setSelectedBlock] = useState<SelectedBlock>(
    { type: null, id: null, handleSide: undefined, range: undefined, editable: false }
  );

  function setBlock(type: "clip" | "suggestion" | "selection", id?: string) {
    const block: SelectedBlock = {
      type,
      id: null,
    };

    if (type === "selection") {
      block.range = selection.range || undefined;
      block.editable = true;
    }

    if (id) {
      block.id = id;

      if (type === "clip") {
        const clip = clips.find((clip) => clip.id === id);
        if (clip) {
          block.range = clip.range;
          block.editable = !clip.processing;
        }
      }
      else if (type === "suggestion") {
        const suggestion = suggestions.find((suggestion) => suggestion.id === id);
        if (suggestion) {
          block.range = suggestion.range;
          block.editable = true;
        }
      }
    }

    setSelectedBlock(block);
  }

  function addHandle(side: "left" | "right") {
    setSelectedBlock({ ...selectedBlock, handleSide: side });
  }

  function startSelection(second: number) {
    const isClipOrSug = selectedBlock.type !== null && selectedBlock.type !== "selection";
    const selectionExist = selection.range !== null || selection.created;

    if (isClipOrSug || selectionExist) {
      setSelectedBlock({ type: null, id: null });
      return;
    }

    setSelection({ range: { start: second, end: second }, created: false });
    setSelectedBlock({ type: "selection", id: null });
  }

  function finishSelection() {
    if (selection.created || !selection.range) return;

    if (selection.range.start === selection.range.end) {
      deleteSelection();
      return;
    }

    setSelection({ ...selection, created: true });
    setSelectedBlock({ type: "selection", id: null, range: selection.range });
  }

  function deleteSelection() {
    setSelection({ range: null, created: false });
  }

  function changeBlockDuration(second: number) {
    if (selectedBlock.type === "selection") {
      if (!selection.range || (selection.created && !selectedBlock.handleSide)) return;

      if (detectCollision(second)) {
        finishSelection();
        return;
      }

      if (selectedBlock.handleSide) {
        if (selectedBlock.handleSide === "left") {
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

    else if (selectedBlock.type === "clip") {
      if (!selectedBlock.handleSide || !selectedBlock.id) return;

      const clipIndex = clips.findIndex((clip) => clip.id === selectedBlock.id);
      if (clipIndex === -1) return;

      const newClips = [...clips];
      const clip = newClips[clipIndex]!;

      if (selectedBlock.handleSide === "left") {
        clip.range.start = second;
      } else {
        clip.range.end = second;
      }

      setClips(newClips);
    } else if (selectedBlock.type === "suggestion") {
      if (!selectedBlock.handleSide || !selectedBlock.id) return;

      const suggestionIndex = suggestions.findIndex((suggestion) => suggestion.id === selectedBlock.id);
      if (suggestionIndex === -1) return;

      const newSuggestions = [...suggestions];
      const suggestion = newSuggestions[suggestionIndex]!;

      if (selectedBlock.handleSide === "left") {
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

  function finishBlockDurationChange() {
    if (selectedBlock.type === "selection") {
      finishSelection();
    }
    else {
      setSelectedBlock({ ...selectedBlock, handleSide: undefined });
    }
  }

  return {
    clips,
    suggestions,
    selection,
    setSelection,
    selectedBlock,
    setBlock,
    addHandle,
    startSelection,
    deleteSelection,
    changeBlockDuration,
    finishBlockDurationChange,
  };
}
