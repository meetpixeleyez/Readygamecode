import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generatePresignedUploadUrl, isR2Configured } from "@/lib/r2";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { filename, fileType, fieldName, fileSize } = body;

    if (!filename || typeof filename !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing filename." },
        { status: 400 }
      );
    }

    // Sanitize filename to prevent path traversal
    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

    // Assign appropriate storage directory
    let folder = "products/uploads";
    if (fieldName === "tempFile" || fieldName === "file") {
      folder = "products/source-codes";
    } else if (fieldName === "demoApk" || cleanFilename.endsWith(".apk")) {
      folder = "products/demo-apks";
    }

    const uniquePrefix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
    const key = `${folder}/${uniquePrefix}-${cleanFilename}`;

    if (!isR2Configured()) {
      return NextResponse.json(
        {
          error: "Cloudflare R2 storage is not configured yet. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in .env.",
          isConfigured: false,
        },
        { status: 503 }
      );
    }

    const { uploadUrl, fileUrl } = await generatePresignedUploadUrl({
      key,
      contentType: fileType || "application/octet-stream",
      expiresInSeconds: 3600, // 1 hour valid for large uploads
    });

    return NextResponse.json({
      success: true,
      uploadUrl,
      fileUrl,
      key,
      storageType: "r2",
    });
  } catch (error: any) {
    console.error("Presigned URL error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate presigned upload URL." },
      { status: 500 }
    );
  }
}
