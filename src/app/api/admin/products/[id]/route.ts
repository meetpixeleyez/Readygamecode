import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { deleteLocalFiles } from "@/lib/file-utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "admin" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, reason, isFeatured } = body;

    const dataToUpdate: any = {};
    if (status !== undefined) {
      if (typeof status !== "number") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      dataToUpdate.status = status;
    }

    if (isFeatured !== undefined) {
      if (typeof isFeatured !== "number") {
        return NextResponse.json({ error: "Invalid isFeatured" }, { status: 400 });
      }
      dataToUpdate.isFeatured = isFeatured;
    }

    const product = await db.product.update({
      where: { id },
      data: dataToUpdate,
    });

    // If it's a rejection and a reason was provided, log it
    if ((status === 2 || status === 3) && reason) {
      await db.rejection.create({
        data: {
          productId: id,
          type: status, // 2=soft, 3=hard based on product status mapping
          reason: reason,
        },
      });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Update product status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const updateProductSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  description: z.string().min(10).optional(),
  price: z.number().min(0).optional(),
  priceCl: z.number().min(0).optional(),
  demoUrl: z.string().url().optional().or(z.literal("")),
  demoApk: z.string().optional().or(z.literal("")),
  previewVideo: z.string().optional().or(z.literal("")),
  thumbnail: z.string().optional().or(z.literal("")),
  file: z.string().optional().or(z.literal("")),
  inlinePreviewImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().max(255).optional().or(z.literal("")),
  metaDescription: z.string().optional().or(z.literal("")),
  reskinPrice: z.number().min(0).optional(),
  publishPrice: z.number().min(0).optional(),
  storeOptimizationPrice: z.number().min(0).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "admin" && session.role !== "ADMIN")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const product = await db.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const dataToUpdate: any = { ...parsed.data };
    if (parsed.data.tags) {
      dataToUpdate.tags = JSON.stringify(parsed.data.tags);
    }
    
    // Auto File Deletion Logic for Replaced Files
    const filesToDelete: string[] = [];
    
    // Check thumbnail replacement
    if (dataToUpdate.thumbnail !== undefined && dataToUpdate.thumbnail !== product.thumbnail && product.thumbnail) {
      filesToDelete.push(product.thumbnail);
    }
    // Check main file replacement
    if (dataToUpdate.file !== undefined && dataToUpdate.file !== product.file && product.file) {
      filesToDelete.push(product.file);
    }
    // Check screenshots replacement/deletion
    if (dataToUpdate.inlinePreviewImage !== undefined) {
      let oldScreenshots: string[] = [];
      try { oldScreenshots = JSON.parse(product.inlinePreviewImage || "[]"); } catch { oldScreenshots = []; }
      
      let newScreenshots: string[] = [];
      try { newScreenshots = JSON.parse(dataToUpdate.inlinePreviewImage || "[]"); } catch { newScreenshots = []; }
      
      const removedScreenshots = oldScreenshots.filter(url => !newScreenshots.includes(url));
      filesToDelete.push(...removedScreenshots);
    }
    
    if (filesToDelete.length > 0) {
      // Non-blocking file deletion
      deleteLocalFiles(filesToDelete).catch(console.error);
    }

    const updated = await db.product.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "admin" && session.role !== "ADMIN")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const product = await db.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    try {
      // Check if product has associated orders to avoid terminal error spam
      const orderCount = await db.orderItem.count({ where: { productId: id } });
      if (orderCount > 0) {
        return NextResponse.json({ error: "Cannot delete product. It has existing orders attached to it. Please take it down instead." }, { status: 400 });
      }

      await db.product.delete({ where: { id } });
      
      // Auto File Deletion Logic for Deleted Product
      const filesToDelete: string[] = [];
      if (product.thumbnail) filesToDelete.push(product.thumbnail);
      if (product.file) filesToDelete.push(product.file);
      if (product.inlinePreviewImage) {
        try {
          const screens = JSON.parse(product.inlinePreviewImage);
          if (Array.isArray(screens)) filesToDelete.push(...screens);
        } catch {
          // Ignore parse error
        }
      }
      
      if (filesToDelete.length > 0) {
        deleteLocalFiles(filesToDelete).catch(console.error);
      }
      
    } catch (dbError: any) {
      if (dbError.code === "P2003" || (dbError.message && dbError.message.includes("foreign key constraint"))) {
        return NextResponse.json({ error: "Cannot delete product. It has existing orders attached to it. Please take it down instead." }, { status: 400 });
      }
      throw dbError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete admin product error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
