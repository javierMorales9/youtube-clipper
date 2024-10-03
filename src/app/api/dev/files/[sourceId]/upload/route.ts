import fs from "fs/promises";
import { NextResponse, type NextRequest } from "next/server";

const addFile = async (
  req: NextRequest,
  { params: { sourceId } }: { params: { sourceId: string } },
) => {
  try {
    const a = await req.blob();
    console.log("a", a);

    //const a = data.get('file');
    if (!a) {
      return new NextResponse(
        JSON.stringify({ message: "No file provided", success: false }),
        {
          status: 400,
        },
      );
    }

    const buffer = Buffer.from(await (a as File).arrayBuffer());

    const basePath = `./public/files/${sourceId}`;

    await fs.mkdir(basePath, { recursive: true });
    await fs.writeFile(`${basePath}/original.mp4`, buffer);

    return NextResponse.json({ success: true }, { headers: { ETag: "123" } });
  } catch (err: unknown) {
    console.log("Error", (err as Error).message);
    return new NextResponse(
      JSON.stringify({ message: (err as Error).message, success: false }),
      {
        status: 400,
      },
    );
  }
};

export { addFile as POST };
