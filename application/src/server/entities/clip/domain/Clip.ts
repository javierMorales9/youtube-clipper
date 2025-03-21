import { newDate } from "@/utils/newDate";
import { v4 as uuidv4 } from "uuid";
import z from "zod";

export enum ThemeFont {
  Komika = "Komika",
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

export enum ThemeEmojiPosition {
  Top = "Top",
  Bottom = "Bottom",
}

export enum DisplayName {
  One = "One",
  Column = "Column",
  Row = "Row",
}

export const SectionSchema = z.object({
  start: z.number(),
  end: z.number(),
  display: z.nativeEnum(DisplayName),
  fragments: z.array(
    z.object({
      order: z.number(),
      x: z.number(),
      y: z.number(),
      size: z.number(),
    }),
  ),
});
export type SectionType = z.infer<typeof SectionSchema>;

export const ThemeSchema = z.object({
  themeFont: z.nativeEnum(ThemeFont),
  themeFontColor: z.string(),
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
  themeEmojiPosition: z.nativeEnum(ThemeEmojiPosition),
});

export type ThemeType = z.infer<typeof ThemeSchema>;

export const ClipSchema = z.object({
  id: z.string(),
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

export type ClipType = z.infer<typeof ClipSchema>;

export const defaultWidth = 0;
export const defaultHeight = 0;

export const defaultDisplay = DisplayName.One;
export const defaultFragments = [
  {
    order: 0,
    x: 0,
    y: 0,
    size: 1/2,
  },
];

export const defaultTheme: ThemeType = {
  themeFont: ThemeFont.Komika,
  themeFontColor: "#FFFFFF",
  themeSize: 12,
  themePosition: 50,
  themeMainColor: "#d4c591",
  themeSecondaryColor: "#63edc3",
  themeThirdColor: "#9560c6",
  themeShadow: ThemeShadow.None,
  themeStroke: ThemeStroke.Small,
  themeStrokeColor: "#000000",
  themeUpperText: false,
  themeEmoji: false,
  themeEmojiPosition: ThemeEmojiPosition.Top,
};

export class Clip {
  id: string;
  companyId: string;
  sourceId: string;
  name: string;
  processing: boolean;
  range: {
    start: number;
    end: number;
  };
  width: number;
  height: number;
  sections: SectionType[];
  theme: ThemeType;
  createdAt: Date;
  updatedAt: Date;

  constructor({
    id,
    companyId,
    name,
    processing,
    sourceId,
    range,
    width,
    height,
    sections,
    theme,
    createdAt,
    updatedAt,
  }: {
    id: string;
    companyId: string;
    name: string;
    processing: boolean;
    sourceId: string;
    range: {
      start: number;
      end: number;
    };
    width: number;
    height: number;
    sections: SectionType[];
    theme: ThemeType;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = id;
    this.companyId = companyId;
    this.name = name;
    this.processing = processing;
    this.sourceId = sourceId;
    this.range = range;
    this.width = width;
    this.height = height;
    this.sections = sections;
    this.theme = theme;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static new({
    sourceId,
    companyId,
    start,
    end
  }: {
    sourceId: string;
    companyId: string;
    start: number;
    end: number;
  }) {
    return new Clip({
      id: uuidv4(),
      companyId: companyId,
      name: "New clip",
      sourceId: sourceId,
      range: {
        start: start,
        end: end,
      },
      processing: false,
      width: defaultWidth,
      height: defaultHeight,
      sections: [
        {
          start: 0,
          end: end - start,
          display: defaultDisplay,
          fragments: defaultFragments,
        },
      ],
      theme: defaultTheme,
      createdAt: newDate(),
      updatedAt: newDate(),
    });
  }

  update(input: ClipType) {
    this.name = input.name;
    this.range = input.range;
    this.width = input.width;
    this.height = input.height;
    this.sections = input.sections;
    this.theme = input.theme;
    this.updatedAt = newDate();
  }

  toPrimitives() {
    return {
      id: this.id,
      companyId: this.companyId,
      name: this.name,
      processing: this.processing,
      sourceId: this.sourceId,
      range: this.range,
      width: this.width,
      height: this.height,
      sections: this.sections,
      theme: this.theme,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  finishProcessing() {
    this.processing = false;
    this.updatedAt = newDate();
  }
}
