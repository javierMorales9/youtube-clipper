import { type NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { getContentTypeFromExtension } from "@/utils/getContentTypeFromExtension";

const handler = async (
  req: NextRequest,
  { params }: { params: { sourceId: string; file: string } },
) => {
  const filePath = path.resolve(`public/files/${params.sourceId}/${params.file}`);
  const imageBuffer = fs.readFileSync(filePath);

  const extension = params.file.split(".").pop() || "png";
  console.log('filePath', extension);
  return new Response(imageBuffer, {
    headers: {
      "content-type": getContentTypeFromExtension(extension),
    },
  });
};

export { handler as GET, handler as POST, handler as PUT };
