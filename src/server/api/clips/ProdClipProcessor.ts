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
    const response = await client.send(command);
    console.log("After submit job");
  },
};
