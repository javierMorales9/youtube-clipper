import { env } from "@/env";
import { Clip } from "./ClipSchema";

export const DevClipProcessor = {
  async processClip(id: string, input: Clip, sourceWidth: number, sourceHeight: number) {
    const { sourceId, range, sections, width, height } = input;

    const body = {
      sourceId,
      clipId: id,
      range,
      sections,
      width,
      height,
      sourceWidth,
      sourceHeight,
    };

    console.log('body', body);
    console.log('url', `${env.AFTER_CLIP_URL}/process/${id}`);
    await fetch(`${env.AFTER_CLIP_URL}/process/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  },
};
