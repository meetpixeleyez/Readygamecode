import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createProductSchema = z.object({
  title: z.string().min(3).max(255),
  categoryId: z.string().min(1, "Category is required"),
  subCategoryId: z.string().min(1, "Subcategory is required"),
  description: z.string().min(10),
  price: z.number().min(0),
  priceCl: z.number().min(0),
  demoUrl: z.string().url("Valid demo URL required").optional().or(z.literal("")),
  demoApk: z.string().optional().or(z.literal("")),
  previewVideo: z.string().url().optional().or(z.literal("")),
  thumbnail: z.string().min(1),
  file: z.string().min(1),
  inlinePreviewImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),
  reskinPrice: z.number().min(0).default(0),
  publishPrice: z.number().min(0).default(0),
  storeOptimizationPrice: z.number().min(0).default(0),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

async function generateUniqueSlug(base: string): Promise<string> {
  let slug = slugify(base);
  if (!slug) slug = `product-${Date.now()}`;

  let suffix = 1;
  while (await db.product.findUnique({ where: { slug } })) {
    slug = `${slugify(base)}-${suffix}`;
    suffix++;
  }
  return slug;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const slug = await generateUniqueSlug(parsed.data.title);

    const product = await db.product.create({
      data: {
        userId: session.sub, // Admin owns this product
        categoryId: parsed.data.categoryId,
        subCategoryId: parsed.data.subCategoryId,
        title: parsed.data.title,
        slug,
        description: parsed.data.description,
        price: parsed.data.price,
        priceCl: parsed.data.priceCl,
        reskinPrice: parsed.data.reskinPrice,
        publishPrice: parsed.data.publishPrice,
        storeOptimizationPrice: parsed.data.storeOptimizationPrice,
        demoUrl: parsed.data.demoUrl,
        demoApk: parsed.data.demoApk || null,
        previewVideo: parsed.data.previewVideo || null,
        thumbnail: parsed.data.thumbnail,
        file: parsed.data.file,
        inlinePreviewImage: parsed.data.inlinePreviewImage || null,
        tags: parsed.data.tags ? JSON.stringify(parsed.data.tags) : null,
        metaTitle: parsed.data.metaTitle || null,
        metaDescription: parsed.data.metaDescription || null,
        status: 1, // Directly approved
        productUpdated: 0,
        attributeInfo: "{}",
      },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error("Create admin product error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
