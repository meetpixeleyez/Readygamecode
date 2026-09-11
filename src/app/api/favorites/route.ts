import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role === "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const userId = session.sub;

    const favorites = await db.productUser.findMany({
      where: { userId: userId },
      select: { productId: true },
    });

    return NextResponse.json(favorites.map((f) => f.productId));
  } catch (error) {
    console.error("Favorites fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized. Please log in to favorite items." }, { status: 401 });
    }
    if (session.role === "admin") {
      return NextResponse.json({ error: "Forbidden: Admins cannot favorite items." }, { status: 403 });
    }
    const userId = session.sub;

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Check if it already exists
    const existing = await db.productUser.findFirst({
      where: {
        userId: userId,
        productId,
      },
    });

    if (existing) {
      // Remove favorite
      await db.productUser.delete({
        where: { productId_userId: { productId, userId } },
      });
      return NextResponse.json({ isFavorited: false });
    } else {
      // Add favorite
      await db.productUser.create({
        data: {
          userId: userId,
          productId,
        },
      });
      return NextResponse.json({ isFavorited: true });
    }
  } catch (error) {
    console.error("Favorites toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
