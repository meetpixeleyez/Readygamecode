import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadToCloudinary, UploadOptions } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Session expired or unauthorized. Please log in again." }, { status: 401 });
    }

    const formData = await req.formData();
    
    // We handle multiple files dynamically by iterating over all entries
    const uploadedFiles: Record<string, string | string[]> = {};
    
    // Convert formData entries to array to handle async loops cleanly
    const entries = Array.from(formData.entries());
    
    for (const [fieldName, formDataEntry] of entries) {
      if (formDataEntry instanceof File) {
        const file = formDataEntry as File;
        if (!file.name || file.size === 0) continue;

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB direct upload limit

        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            {
              error: `File "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 10MB upload limit. Maximum 10MB is allowed for direct file uploading. For files larger than 10MB, please provide a Google Drive / Download link URL instead.`,
            },
            { status: 400 }
          );
        }

        const isArchiveOrApk =
          file.name.endsWith(".apk") ||
          file.name.endsWith(".zip") ||
          file.name.endsWith(".rar") ||
          file.name.endsWith(".7z") ||
          fieldName === "tempFile" ||
          fieldName === "file" ||
          fieldName === "demoApk";

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Determine folder & resource type based on field name or file extension
        let folder = "readygamecode/uploads";
        let resourceType: "auto" | "image" | "raw" = "auto";

        if (fieldName === "thumbnail") {
          folder = "readygamecode/thumbnails";
          resourceType = "image";
        } else if (fieldName === "inlinePreviewImage") {
          folder = "readygamecode/screenshots";
          resourceType = "image";
        } else if (fieldName === "coverImage") {
          folder = "readygamecode/blog";
          resourceType = "image";
        } else if (fieldName === "avatar") {
          folder = "readygamecode/avatars";
          resourceType = "image";
        } else if (isArchiveOrApk) {
          folder = fieldName === "demoApk" ? "readygamecode/demo-apk" : "readygamecode/files";
          resourceType = "raw";
        }

        const options: UploadOptions = {
          folder,
          resourceType,
          filename: file.name,
        };

        const result = await uploadToCloudinary(buffer, options);
        const fileUrl = result.secure_url;

        // If field already exists (e.g. multiple screenshots), make it an array
        if (uploadedFiles[fieldName]) {
          if (Array.isArray(uploadedFiles[fieldName])) {
            (uploadedFiles[fieldName] as string[]).push(fileUrl);
          } else {
            uploadedFiles[fieldName] = [uploadedFiles[fieldName] as string, fileUrl];
          }
        } else {
          uploadedFiles[fieldName] = fileUrl;
        }
      }
    }

    if (Object.keys(uploadedFiles).length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    return NextResponse.json({ success: true, files: uploadedFiles });
  } catch (error: any) {
    console.error("Upload error details:", {
      message: error?.message,
      name: error?.name,
      http_code: error?.http_code,
      details: error,
    });
    return NextResponse.json(
      { error: error?.message || "File upload failed on server" },
      { status: error?.http_code || 500 }
    );
  }
}
