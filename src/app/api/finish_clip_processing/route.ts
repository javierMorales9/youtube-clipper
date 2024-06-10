import { api } from "@/trpc/server";
import { NextResponse, type NextRequest } from "next/server";

const handler = async (req: NextRequest) => {
  const body = await req.json();

  //Don't delete we need it to activate the sns topic 
  console.log('after clip processing body', body);

  const { id } = body.Message !== undefined ? body.Message : body;
  await api.clip.finishProcessing({ id });

  return NextResponse.json({ success: true });
};

export { handler as GET, handler as POST, handler as PUT };
