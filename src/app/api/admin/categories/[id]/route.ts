import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const categoryId = resolvedParams.id;
    const body = await req.json();
    const { name, image, fileType, personalBuyerFee, commercialBuyerFee, twelveMonthExtendedFee, status } = body;

    const category = await db.category.update({
      where: { id: categoryId },
      data: {
        ...(name && { name }),
        ...(image !== undefined && { image }),
        ...(fileType !== undefined && { fileType }),
        ...(personalBuyerFee !== undefined && { personalBuyerFee: Number(personalBuyerFee) }),
        ...(commercialBuyerFee !== undefined && { commercialBuyerFee: Number(commercialBuyerFee) }),
        ...(twelveMonthExtendedFee !== undefined && { twelveMonthExtendedFee: Number(twelveMonthExtendedFee) }),
        ...(status !== undefined && { status: Number(status) }),
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const categoryId = resolvedParams.id;

    await db.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
