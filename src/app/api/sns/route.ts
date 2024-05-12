import { NextResponse, type NextRequest } from "next/server";

const handler = (req: NextRequest) => {
  console.log('a new sns message', req, req.text());

  return NextResponse.json({ message: "Hello, World!" });
}

export { handler as GET, handler as POST, handler as PUT };
