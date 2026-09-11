import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update user to be an author
    await db.user.update({
      where: { id: session.sub },
      data: { isAuthor: 1 },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error applying for author:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
