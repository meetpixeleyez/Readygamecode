import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
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

    const subCategory = await db.subCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(formId !== undefined && { formId }),
        ...(status !== undefined && { status: Number(status) }),
      },
    });

    return NextResponse.json(subCategory);
  } catch (error) {
    console.error("Update subcategory error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db.subCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete subcategory error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
