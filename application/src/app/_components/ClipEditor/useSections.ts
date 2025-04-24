"use client";

import { Timer } from "@/app/_components/useTimer";
import { UseFormReturn } from "react-hook-form";
import { useEffect, useState } from "react";
import { Displays } from "./Displays";
import { ClipType, DisplayName } from "@/server/entities/clip/domain/Clip";

export function useSections(
  timer: Timer,
  form: UseFormReturn<ClipType, null, undefined>,
) {
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number>(0);
  const selectedSection = form.watch("sections")[selectedSectionIndex];

  useEffect(() => {
    const range = form.getValues().range;

    if (!form.getValues().sections.length) {
      form.setValue("sections", [
        {
          start: 0,
          end: range.end - range.start,
          display: DisplayName.One,
          fragments: Displays.One.map((element, i) => ({
            order: i,
            x: element.x,
            y: element.y,
            size: 1 / 2,
          })),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    const sections = form.getValues().sections;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (
        section &&
        section.start <= timer.currentSeconds &&
        timer.currentSeconds <= section.end
      ) {
        setSelectedSectionIndex(i);
        return;
      }
    }
  }, [timer.currentSeconds]);

  function divideSection() {
    const sections = form.getValues().sections;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (
        section &&
        section.start <= timer.currentSeconds &&
        timer.currentSeconds <= section.end
      ) {
        const newSection = {
          ...section,
          start: timer.currentSeconds,
        };
        section.end = timer.currentSeconds;

        //we add a new section after the current one.
        sections.splice(i + 1, 0, newSection);

        form.setValue("sections", sections);
        return;
      }
    }
  }

  function deleteSection() {
    const sections = form.getValues().sections;

    //If there is only one section, we can't delete it.
    if (sections.length === 1) return;

    const sectionToDelete = sections[selectedSectionIndex];
    if (!sectionToDelete) return;

    if (selectedSectionIndex === 0) {
      //If we delete the first section, we join to the next section.
      sections[selectedSectionIndex + 1]!.start = 0;
    } else {
      //Otherwise, we join to the previous section.
      sections[selectedSectionIndex - 1]!.end = sectionToDelete.end;
    }

    sections.splice(selectedSectionIndex, 1);
    form.setValue("sections", sections);
  }

  const changeDisplay = (newDisplay: DisplayName) => {
    if (!selectedSection || newDisplay === selectedSection.display) return;

    selectedSection.display = newDisplay;
    selectedSection.fragments = Displays[newDisplay].map((element, i) => ({
      order: i,
      x: element.x,
      y: element.y,
      size: 1/2,
    }));

    form.setValue("sections", form.getValues("sections"));
  };

  const modifyFragment = (
    i: number,
    newAttrs: {
      x: number;
      y: number;
      size: number;
    },
  ) => {
    if (!selectedSection?.fragments || !selectedSection?.fragments[i]) return;

    selectedSection.fragments[i] = {
      order: selectedSection.fragments[i]?.order ?? i,
      x: newAttrs.x,
      y: newAttrs.y,
      size: newAttrs.size,
    };

    form.setValue("sections", form.watch("sections"));
  };

  return {
    selectedSection,
    selectedSectionIndex,
    setSelectedSectionIndex,
    divideSection,
    deleteSection,
    changeDisplay,
    modifyFragment,
  };
}
