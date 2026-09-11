import fs from "fs";
import path from "path";
import { deleteFromCloudinary } from "./cloudinary";

/**
 * Deletes files from storage (both Cloudinary CDN and legacy local /uploads)
 */
export async function deleteLocalFiles(fileUrls: string[]) {
  const publicDir = path.join(process.cwd(), "public");

  for (const fileUrl of fileUrls) {
    if (!fileUrl) continue;

    // Handle Cloudinary hosted files
    if (fileUrl.includes("res.cloudinary.com")) {
      try {
        await deleteFromCloudinary(fileUrl);
      } catch (error) {
        console.error(`Failed to delete Cloudinary file at ${fileUrl}:`, error);
      }
      continue;
    }
    
    // Handle local files, i.e., those that start with /uploads
    if (fileUrl.startsWith("/uploads")) {
      try {
        const filePath = path.join(publicDir, fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Successfully deleted local file: ${filePath}`);
        }
      } catch (error) {
        console.error(`Failed to delete local file at ${fileUrl}:`, error);
      }
    }
  }
}
