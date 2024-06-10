import { env } from "@/env";
import { Clip } from "./ClipSchema";
import { BatchClient, SubmitJobCommand } from "@aws-sdk/client-batch";

export const ProdClipProcessor = {
  async processClip(
    id: string,
    input: Clip,
    sourceWidth: number,
    sourceHeight: number,
  ) {
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

    const client = new BatchClient({
      region: env.AWS_REGION,
    });

    console.log('about to submit a job', body);
    const command = new SubmitJobCommand({
      jobName: 'after_clip_update',
      jobQueue: env.JOB_QUEUE,
      jobDefinition: env.AFTER_CLIP_JOB_DEFINITION,
      containerOverrides: {
        environment: [
          {
            name: "INPUT",
            value: JSON.stringify(body),
          },
        ],
      },
    });
    try { 
      const response = await client.send(command);
      console.log("After submit job");
    } catch(e) {
      console.error("Error submitting job", e);
    }
  },
};
