import { env } from "@/env";
import { Clip } from "./ClipSchema";

export const DevClipProcessor = {
  async processClip(id: string, input: Clip) {
    await fetch(`${env.AFTER_CLIP_URL}/process/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
  },
}
