import { Section, Clip as ClipBack } from "@/server/api/clips/ClipSchema";

export type Display = {
  name: string;
  elements: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
};

export type SectionFront = Omit<Section, "display"> & { display?: Display };
export type Clip = Omit<ClipBack, "sections"> & { sections: SectionFront[] };
