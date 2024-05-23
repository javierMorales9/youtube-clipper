import { api } from "@/trpc/server";
import { NextResponse, type NextRequest } from "next/server";

const handler = async (req: NextRequest) => {
  const { id } = await req.json();
  await api.source.finishProcessing({ id });

  return NextResponse.json({ success: true });
};

export { handler as GET, handler as POST, handler as PUT };
