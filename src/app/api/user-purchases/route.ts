import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderItems = await db.orderItem.findMany({
      where: {
        order: {
          userId: session.sub,
          paymentStatus: 1,
        }
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            userId: true, // sellerId
          }
        }
      },
      distinct: ['productId'],
    });

    const products = orderItems.map(item => ({
      id: item.product.id,
      title: item.product.title,
      sellerId: item.product.userId,
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error("Fetch user purchases error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
