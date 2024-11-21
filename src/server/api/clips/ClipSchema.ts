import { Displays } from "@/app/sources/[sourceId]/clips/Displays";
import z from "zod";

export enum ThemeFont {
  Arial = "Arial",
  ComicSans = "ComicSans",
  Impact = "Impact",
  TimesNewRoman = "TimesNewRoman",
  Verdana = "Verdana",
}

export enum ThemeShadow {
  None = "None",
  Small = "Small",
  Medium = "Medium",
  Large = "Large",
}

export enum ThemeStroke {
  None = "None",
  Small = "Small",
  Medium = "Medium",
  Large = "Large",
}

export const SectionSchema = z.object({
  start: z.number(),
  end: z.number(),
  display: z.string(),
  fragments: z.array(
    z.object({
      order: z.number(),
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
  ),
});

export type Section = z.infer<typeof SectionSchema>;

export const ThemeSchema = z.object({
  themeFont: z.nativeEnum(ThemeFont),
  themeSize: z.number(),
  themeMainColor: z.string(),
  themeSecondaryColor: z.string(),
  themeThirdColor: z.string(),
  themeShadow: z.nativeEnum(ThemeShadow),
  themeStroke: z.nativeEnum(ThemeStroke),
  themeStrokeColor: z.string(),
  themeUpperText: z.boolean(),
  themePosition: z.number(),
  themeEmoji: z.boolean(),
});

export type Theme = z.infer<typeof ThemeSchema>;

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
  sections: z.array(SectionSchema),
  theme: ThemeSchema,
});

export type Clip = z.infer<typeof ClipSchema>;

export const defaultWidth = 0;
export const defaultHeight = 0;

export const defaultDisplay = Displays.One.name;
export const defaultFragments = [
  {
    order: 0,
    x: 0,
    y: 0,
    width: 270,
    height: 480,
  },
];

export const defaultTheme = {
  themeFont: ThemeFont.Arial,
  themeSize: 12,
  themePosition: 50,
  themeMainColor: "#000000",
  themeSecondaryColor: "#000000",
  themeThirdColor: "#000000",
  themeShadow: ThemeShadow.Medium,
  themeStroke: ThemeStroke.Small,
  themeStrokeColor: "#000000",
  themeUpperText: false,
  themeEmoji: false,
};
