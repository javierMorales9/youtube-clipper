import { api } from "@/trpc/server";
import { NextResponse, type NextRequest } from "next/server";

const handler = async (req: NextRequest) => {
  console.log("señores, en esas estamos", req.body);

  api.source.finishProcessing({ id: "123" });

  return NextResponse.json({ message: "Hello, World!" });
};

export { handler as GET, handler as POST, handler as PUT };
