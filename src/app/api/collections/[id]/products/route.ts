import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.sub;

    const resolvedParams = await params;
    const collectionId = resolvedParams.id;
    
    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Verify user owns collection
    const collection = await db.productCollection.findUnique({
      where: { id: collectionId },
    });

    if (!collection || collection.userId !== userId) {
      return NextResponse.json({ error: "Collection not found or unauthorized" }, { status: 404 });
    }

    // Check if product is already in collection
    const existing = await db.productCollectionItem.findFirst({
      where: {
        collectionId,
        productId,
      },
    });

    if (existing) {
      // Remove it
      await db.productCollectionItem.delete({
        where: {
          productId_collectionId: {
            productId,
            collectionId,
          }
        },
      });
      return NextResponse.json({ added: false });
    } else {
      // Add it
      await db.productCollectionItem.create({
        data: {
          collectionId,
          productId,
        },
      });
      return NextResponse.json({ added: true });
    }
  } catch (error) {
    console.error("Collection product toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
