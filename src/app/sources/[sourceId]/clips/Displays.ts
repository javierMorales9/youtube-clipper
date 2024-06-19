import { z } from "zod";

export const DisplaySchema = z.object({
  name: z.string(),
  elements: z.array(z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })),
});

export const Displays = {
  One: {
    name: 'One',
    image: '/images/One.png',
    elements: [
      {
        x: 0,
        y: 0,
        width: 270,
        height: 480,
      },
    ],
  },
  TwoColumn: {
    name: 'TwoColumn',
    image: '/images/TwoColumns.png',
    elements: [
      {
        x: 0,
        y: 0,
        width: 270,
        height: 240,
      },
      {
        x: 0,
        y: 240,
        width: 270,
        height: 240,
      },
    ],
  },
  TwoRow: {
    name: 'TwoRow',
    image: '/images/TwoRows.png',
    elements: [
      {
        x: 0,
        y: 0,
        width: 135,
        height: 480,
      },
      {
        x: 135,
        y: 0,
        width: 135,
        height: 480,
      },
    ],
  },
};

export type DisplayKey = keyof typeof Displays;

