import { api } from "@/trpc/server";
import { NextResponse, type NextRequest } from "next/server";

const handler = async (req: NextRequest) => {
  const body = (await req.json()) as {
    Message?: string;
    id: string;
    resolution: string;
    duration: number;
    suggestions: {
      name: string;
      description: string;
      start: number;
      end: number;
    }[];
  };

  //Don't delete we need it to activate the sns topic
  console.log("after source processing body", body);

  const { id, resolution, duration, suggestions } =
    body.Message !== undefined ? JSON.parse(body.Message) : body;
  console.log("after source processing", id, resolution, suggestions, body.Message);
  await api.source.finishProcessing({ id, resolution, duration, suggestions });

  return NextResponse.json({ success: true });
};

export { handler as GET, handler as POST, handler as PUT };
