import { env } from "@/env";
import { Clip } from "./ClipSchema";

export const DevClipProcessor = {
  async processClip(id: string, input: Clip, sourceWidth: number, sourceHeight: number) {
    const { sourceId, clipId, range, sections, width, height } = input;

    const body = {
      sourceId,
      clipId,
      range,
      sections,
      width,
      height,
      sourceWidth,
      sourceHeight,
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
