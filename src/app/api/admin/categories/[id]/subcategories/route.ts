import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const subCategories = await db.subCategory.findMany({
      where: { categoryId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(subCategories);
  } catch (error) {
    console.error("Fetch subcategories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, formId, status } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const subCategory = await db.subCategory.create({
      data: {
        name,
        categoryId: id,
        formId,
        status: status !== undefined ? Number(status) : 1,
      },
    });

    return NextResponse.json(subCategory);
  } catch (error) {
    console.error("Create subcategory error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
