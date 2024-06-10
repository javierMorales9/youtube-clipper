import { api } from "@/trpc/server";
import { NextResponse, type NextRequest } from "next/server";

const handler = async (req: NextRequest) => {
  const body = await req.json();

  //Don't delete we need it to activate the sns topic
  console.log('after source processing body', body);

  const { id, resolution } = body;
  await api.source.finishProcessing({ id, resolution });

  return NextResponse.json({ success: true });
};

export { handler as GET, handler as POST, handler as PUT };
