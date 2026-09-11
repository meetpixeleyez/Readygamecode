import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createProductSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  categoryId: z.string().min(1, "Category is required"),
  subCategoryId: z.string().min(1, "Subcategory is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price must be >= 0"),
  priceCl: z.number().min(0, "Commercial price must be >= 0"),
  demoUrl: z.string().url("Valid demo URL required").optional().or(z.literal("")),
  demoApk: z.string().optional().or(z.literal("")),
  previewVideo: z.string().url("Valid preview video URL required").optional().or(z.literal("")),
  thumbnail: z.string().min(1, "Thumbnail required"),
  tempFile: z.string().min(1, "Main file required"),
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.sub },
      select: { id: true, isAuthor: true, status: true },
    });

    if (!user || user.isAuthor !== 1) {
      return NextResponse.json(
        { error: "Only authors can upload products" },
        { status: 403 }
      );
    }

    if (user.status !== 1) {
      return NextResponse.json(
        { error: "Your account is not active" },
        { status: 403 }
      );
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
        userId: user.id,
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
        tempFile: parsed.data.tempFile,
        inlinePreviewImage: parsed.data.inlinePreviewImage || null,
        tags: parsed.data.tags ? JSON.stringify(parsed.data.tags) : null,
        metaTitle: parsed.data.metaTitle || null,
        metaDescription: parsed.data.metaDescription || null,
        status: 0, // PENDING — awaiting reviewer approval
        productUpdated: 0,
        attributeInfo: "{}",
      },
    });

    // Create activity log
    await db.activity.create({
      data: {
        userId: user.id,
        productId: product.id,
        message: "Product submitted for review",
        actionType: "REPLY",
        status: 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        product: {
          id: product.id,
          slug: product.slug,
          title: product.title,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
