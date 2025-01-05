import { DisplayName } from "@/server/entities/clip/domain/Clip";

export type Display = {
  name: DisplayName;
  fragments: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
};

export const Displays: Record<DisplayName, Display & { image: string }> = {
  [DisplayName.One]: {
    name: DisplayName.One,
    image: "/images/One.png",
    fragments: [
      {
        x: 0,
        y: 0,
        width: 270,
        height: 480,
      },
    ],
  },
  [DisplayName.TwoColumn]: {
    name: DisplayName.TwoColumn,
    image: "/images/TwoColumns.png",
    fragments: [
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
  [DisplayName.TwoRow]: {
    name: DisplayName.TwoRow,
    image: "/images/TwoRows.png",
    fragments: [
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
