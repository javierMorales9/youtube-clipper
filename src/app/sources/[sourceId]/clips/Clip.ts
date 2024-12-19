import { SectionType, ClipType as ClipBack } from "@/server/entities/clip/domain/Clip";

export type Display = {
  name: string;
  elements: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
};

export type SectionFront = Omit<SectionType, "display"> & { display?: Display };
export type Clip = Omit<ClipBack, "sections"> & { sections: SectionFront[] };
