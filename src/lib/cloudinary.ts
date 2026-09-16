import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary cleanly supporting both CLOUDINARY_URL and individual keys
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "readygamecode",
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export default cloudinary;

export interface UploadOptions {
  folder?: string;
  resourceType?: "auto" | "image" | "raw" | "video";
  filename?: string;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<{ secure_url: string; public_id: string }> {
  const { folder = "readygamecode/uploads", resourceType = "auto", filename } = options;

  return new Promise((resolve, reject) => {
    const uploadParams: Record<string, any> = {
      folder,
      resource_type: resourceType,
    };

    if (process.env.CLOUDINARY_UPLOAD_PRESET) {
      uploadParams.upload_preset = process.env.CLOUDINARY_UPLOAD_PRESET;
    }

    if (filename) {
      // Extract extension if any
      const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : "";
      const baseName = filename
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 80);

      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // For raw files, keep the extension so downloaded files preserve file type
      uploadParams.public_id = resourceType === "raw" 
        ? `${baseName || "file"}_${uniqueSuffix}${ext}` 
        : `${baseName || "file"}_${uniqueSuffix}`;
    } else {
      uploadParams.use_filename = true;
      uploadParams.unique_filename = true;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadParams,
      (error, result) => {
        if (error || !result) {
          console.error("Cloudinary upload_stream error:", error);
          return reject(error || new Error("Cloudinary upload failed with empty result"));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Extracts the public_id and resource_type from a Cloudinary URL
 */
export function extractCloudinaryInfo(url: string): { publicId: string; resourceType: "image" | "raw" | "video" } | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    
    // Find index of 'upload'
    const uploadIndex = pathParts.indexOf("upload");
    if (uploadIndex === -1) return null;

    const rawResourceType = pathParts[uploadIndex - 1];
    const resourceType: "image" | "raw" | "video" = 
      rawResourceType === "raw" ? "raw" : rawResourceType === "video" ? "video" : "image";
    
    // Slice everything after 'upload/' (skipping version like 'v1788165410' or transform parameters)
    let remainingParts = pathParts.slice(uploadIndex + 1);
    while (remainingParts.length > 0 && (/^v\d+$/.test(remainingParts[0]) || remainingParts[0].includes(","))) {
      remainingParts = remainingParts.slice(1);
    }

    const fullPath = remainingParts.join("/");
    // For images/videos, public_id does not include file extension in Cloudinary API
    let publicId = fullPath;
    if (resourceType === "image" || resourceType === "video") {
      publicId = fullPath.replace(/\.[^/.]+$/, "");
    }

    return { publicId, resourceType };
  } catch (e) {
    return null;
  }
}

/**
 * Deletes a file/image from Cloudinary by its URL
 */
export async function deleteFromCloudinary(url: string): Promise<boolean> {
  const info = extractCloudinaryInfo(url);
  if (!info) return false;

  try {
    const res = await cloudinary.uploader.destroy(info.publicId, { resource_type: info.resourceType });
    if (res.result === "not found" && info.resourceType !== "raw") {
      // Fallback check for raw assets
      await cloudinary.uploader.destroy(info.publicId, { resource_type: "raw" });
    }
    console.log(`Cloudinary asset deleted: ${info.publicId} (${res.result})`);
    return true;
  } catch (err) {
    console.error(`Failed to delete Cloudinary asset at ${url}:`, err);
    return false;
  }
}
