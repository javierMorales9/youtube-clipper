import z from "zod";

export const ClipSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  processing: z.boolean().optional(),
  sourceId: z.string(),
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
