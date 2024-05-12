import { NextResponse, type NextRequest } from "next/server";

const handler = async (req: NextRequest) => {
  console.log('señores, en esas estamos');

  return NextResponse.json({ message: "Hello, World!" });
}

export { handler as GET, handler as POST, handler as PUT };
