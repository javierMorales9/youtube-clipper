import z from "zod";

export type Display = {
  name: string;
  elements: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
};

export type Clip = {
  clipId?: string;
  processing?: boolean;
  name: string;
  range: {
    start: number;
    end: number;
  };
  width: number;
  height: number;
  sections: {
    start: number;
    end: number;
    display?: Display;
    fragments?: {
      x: number;
      y: number;
      width: number;
      height: number;
    }[];
  }[];
};

export type Section = Clip["sections"][0];
