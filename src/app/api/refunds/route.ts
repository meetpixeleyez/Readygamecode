import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { broadcastNotification } from "@/lib/sse";

const newRefundSchema = z.object({
  orderItemId: z.string(),
  reason: z.string().min(10, "Reason must be at least 10 characters long"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = newRefundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { orderItemId, reason } = parsed.data;

    // Verify order item belongs to buyer and is not refunded/already requested
    const orderItem = await db.orderItem.findFirst({
      where: {
        id: orderItemId,
        userId: user.sub,
        isRefunded: 0,
      },
      include: {
        product: true,
        refundRequests: true,
      },
    });

    if (!orderItem) {
      return NextResponse.json({ error: "Invalid order item or already refunded." }, { status: 400 });
    }

    if (orderItem.refundRequests.length > 0) {
      return NextResponse.json({ error: "Refund already requested for this item." }, { status: 400 });
    }

    let totalRefundAmount = orderItem.productPrice;
    if (orderItem.isExtended === 1) {
      totalRefundAmount += orderItem.extendedAmount;
    }
    if (orderItem.reskinSelected === 1) {
      totalRefundAmount += orderItem.product.reskinPrice;
    }
    if (orderItem.publishSelected === 1) {
      totalRefundAmount += orderItem.product.publishPrice;
    }
    if (orderItem.storeOptimizationSelected === 1) {
      totalRefundAmount += orderItem.product.storeOptimizationPrice;
    }

    // Include the buyer fee that was paid, and subtract any discount they received
    totalRefundAmount += orderItem.buyerFee;
    totalRefundAmount -= orderItem.discount;

    // Create the refund request and the first activity message
    const refundRequest = await db.$transaction(async (tx) => {
      const rr = await tx.refundRequest.create({
        data: {
          orderItemId,
          reason,
          status: 0, // Pending
          userId: orderItem.product.userId, // Seller
          buyerId: user.sub,
          amount: totalRefundAmount,
          sellerUnreadCount: 1, // New request means 1 unread message for seller
        },
      });

      await tx.refundActivity.create({
        data: {
          refundRequestId: rr.id,
          message: reason,
          buyerId: user.sub,
        },
      });

      await tx.adminNotification.create({
        data: {
          title: `Refund request submitted for ${orderItem.product.title}`,
          clickUrl: `/admin/refunds/${rr.id}`,
          isRead: 0,
        },
      });

      return rr;
    });

    // Notify seller & admin via SSE
    broadcastNotification("all");

    return NextResponse.json({ success: true, refundRequestId: refundRequest.id });
  } catch (error) {
    console.error("Create refund error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
