import { env } from "@/env";
import { Clip } from "./ClipSchema";
import { DisplayKey, Displays } from "@/app/sources/[sourceId]/clips/Displays";

export const DevClipProcessor = {
  async processClip(id: string, input: Clip) {
    const { sourceId, clipId, range, sections } = input;

    const body = {
      sourceId,
      clipId,
      range,
      sections: sections.map((section) => ({
        start: section.start,
        end: section.end,
        display: Displays[section.display as DisplayKey].elements,
        fragments: section.fragments,
      })),
    };

    console.log('body', body);
    await fetch(`${env.AFTER_CLIP_URL}/process/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  },
};
