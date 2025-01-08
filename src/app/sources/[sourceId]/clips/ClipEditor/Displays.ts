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

export const Displays: Record<DisplayName, Display> = {
  [DisplayName.One]: {
    name: DisplayName.One,
    fragments: [
      {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      },
    ],
  },
  [DisplayName.TwoColumn]: {
    name: DisplayName.TwoColumn,
    fragments: [
      {
        x: 0,
        y: 0,
        width: 1,
        height: 1/2,
      },
      {
        x: 0,
        y: 1/2,
        width: 1,
        height: 1/2,
      },
    ],
  },
  [DisplayName.TwoRow]: {
    name: DisplayName.TwoRow,
    fragments: [
      {
        x: 0,
        y: 0,
        width: 1/2,
        height: 1,
      },
      {
        x: 1/2,
        y: 0,
        width: 1/2,
        height: 1,
      },
    ],
  },
};
