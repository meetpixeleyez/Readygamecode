import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await db.blogPost.findMany({
      include: { blogCategory: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Fetch blog posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, slug, excerpt, body: contentBody, coverImage, isPublished, blogCategoryId } = body;

    if (!title || !slug || !contentBody) {
      return NextResponse.json({ error: "Title, slug, and body are required" }, { status: 400 });
    }

    const post = await db.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        body: contentBody,
        coverImage,
        isPublished: isPublished ? 1 : 0,
        publishedAt: isPublished ? new Date() : null,
        blogCategoryId: blogCategoryId || null,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error("Create blog post error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Slug must be unique" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
