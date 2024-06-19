import z from "zod";

export const ClipSchema = z.object({
  sourceId: z.string(),
  name: z.string(),
  clipId: z.string().optional(),
  range: z.object({
    start: z.number(),
    end: z.number(),
  }),
  width: z.number(),
  height: z.number(),
  sections: z.array(
    z.object({
      start: z.number(),
      end: z.number(),
      display: z.string(),
      fragments: z.array(
        z.object({
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number(),
        }),
      ),
    }),
  ),
});

export type Clip = z.infer<typeof ClipSchema>;
