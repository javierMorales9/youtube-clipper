import { DisplayName } from "@/server/entities/clip/domain/Clip";

export type Display = {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];

export const Displays: Record<DisplayName, Display> = {
  [DisplayName.One]: [
      {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      },
    ],
  [DisplayName.TwoColumn]: [
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
  [DisplayName.TwoRow]: [
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
};
