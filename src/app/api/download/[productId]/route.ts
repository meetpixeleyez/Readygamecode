import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createReadStream, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { productId } = await params;
    const userId = session.sub;

    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        userId: true,
        title: true,
        file: true,
        isFree: true,
      },
    });

    if (!product || !product.file) {
      return NextResponse.json({ error: "Product or file not found." }, { status: 404 });
    }

    // 1. Check if user is Admin or the Product Author or Product is Free
    const isAdmin = session.role === "admin" || session.role === "ADMIN";
    const isAuthor = product.userId === userId;
    let isAllowed = isAdmin || isAuthor || product.isFree === 1;

    // 2. If not admin/author/free, verify active non-refunded purchase
    if (!isAllowed) {
      const validPurchase = await db.orderItem.findFirst({
        where: {
          productId: product.id,
          userId: userId,
          isRefunded: 0,
          order: { paymentStatus: 1 },
          refundRequests: {
            none: {
              status: { in: [0, 1] }, // Exclude pending (0) or approved (1) refund requests
            },
          },
        },
      });

      if (validPurchase) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Access Denied: Download is disabled for refunded or unpurchased products." },
        { status: 403 }
      );
    }

    // 3. File resolution and streaming
    const fileRelativePath = product.file;
    let absolutePath = fileRelativePath;

    if (fileRelativePath.startsWith("/")) {
      absolutePath = join(process.cwd(), "public", fileRelativePath);
    }

    if (!existsSync(absolutePath)) {
      // If direct file URL is external or hosted remotely, redirect securely
      if (fileRelativePath.startsWith("http://") || fileRelativePath.startsWith("https://")) {
        return NextResponse.redirect(fileRelativePath);
      }
      return NextResponse.json({ error: "File not found on storage server." }, { status: 404 });
    }

    const filename = absolutePath.split(/[/\\]/).pop() || `${product.id}.zip`;
    const stream = createReadStream(absolutePath);

    return new NextResponse(stream as any, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("Secure download API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
