import { api } from "@/trpc/server";
import { NextResponse, type NextRequest } from "next/server";

const handler = async (req: NextRequest) => {
  const message = await req.json();
  const data = JSON.parse(message);
  console.log(data);

  await api.source.finishProcessing({ id: data.id });

  return NextResponse.next();
};

export { handler as GET, handler as POST, handler as PUT };
