import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { existsSync, createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filenameSegments = resolvedParams.filename || [];
    const filename = filenameSegments.join("/");

    if (!filename || filename.includes("..")) {
      return new NextResponse("Invalid file path", { status: 400 });
    }

    // Check possible locations
    const possiblePaths = [
      join(process.cwd(), "public", "uploads", filename),
      join(process.cwd(), ".next", "standalone", "public", "uploads", filename),
    ];

    let targetPath = "";
    for (const p of possiblePaths) {
      if (existsSync(p)) {
        targetPath = p;
        break;
      }
    }

    if (!targetPath) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileStats = await stat(targetPath);
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      svg: "image/svg+xml",
      ico: "image/x-icon",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      apk: "application/vnd.android.package-archive",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      pdf: "application/pdf",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";
    const nodeStream = createReadStream(targetPath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStats.size.toString(),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Error serving uploaded file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}