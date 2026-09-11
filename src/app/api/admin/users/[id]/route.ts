import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
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
    const { status } = body;

    if (typeof status !== "number") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Update user status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
