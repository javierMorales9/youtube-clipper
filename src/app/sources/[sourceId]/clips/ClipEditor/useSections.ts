"use client";

import { Timer } from "../../useTimer";
import { UseFormReturn } from "react-hook-form";
import { Clip, Display } from "../Clip";
import { useEffect, useState } from "react";
import { Displays } from "../Displays";

export function useSections(
  timer: Timer,
  form: UseFormReturn<Clip, null, undefined>,
) {
  const [selectedSection, setSelectedSection] = useState<number>(0);
  const section = form.watch("sections")[selectedSection];

  useEffect(() => {
    const range = form.getValues().range;

    if (!form.getValues().sections.length) {
      form.setValue("sections", [
        {
          start: 0,
          end: range.end - range.start,
          display: Displays.One,
          fragments: [
            {
              order: 0,
              x: 0,
              y: 0,
              width: 270,
              height: 480,
            },
          ],
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
        setSelectedSection(i);
        return;
      }
    }
  }, [timer.currentTime]);

  function divideSection() {
    const sections = form.getValues().sections;

    timer.currentSeconds;

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

    if (sections.length === 1) return;

    const section = sections[selectedSection];

    if (!section) return;

    if (selectedSection === 0) {
      //We put this instead of harcoding 1 because typescript complains.
      sections[selectedSection + 1]!.start = 0;
    } else {
      sections[selectedSection - 1]!.end = section.end;
    }

    sections.splice(selectedSection, 1);
    form.setValue("sections", sections);
  }

  const handleSelectDisplay = (newDisplay: Display) => {
    if (!section || newDisplay.name === section.display?.name) return;

    section.display = newDisplay;
    section.fragments = newDisplay.elements.map((element, i) => ({
      order: i,
      x: element.x,
      y: element.y,
      width: element.width / 2,
      height: element.height / 2,
    }));

    form.setValue("sections", form.getValues("sections"));
  };

  const modifyFragment = (
    i: number,
    newAttrs: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
  ) => {
    if (!section?.fragments || !section?.fragments[i]) return;

    section.fragments[i] = {
      order: section.fragments[i]?.order ?? i,
      x: newAttrs.x,
      y: newAttrs.y,
      width: newAttrs.width,
      height: newAttrs.height,
    };

    form.setValue("sections", form.watch("sections"));
  };

  return {
    section,
    selectedSection,
    setSelectedSection,
    divideSection,
    deleteSection,
    handleSelectDisplay,
    modifyFragment,
  };
}
