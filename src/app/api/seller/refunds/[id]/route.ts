import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { broadcastNotification } from "@/lib/sse";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["approve", "decline"]),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { action } = parsed.data;

    const refund = await db.refundRequest.findUnique({
      where: { id, userId: user.sub },
      include: {
        orderItem: {
          include: { product: true },
        },
      },
    });

    if (!refund) {
      return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
    }

    if (refund.status !== 0) {
      return NextResponse.json({ error: "Refund request already processed" }, { status: 400 });
    }

    if (action === "decline") {
      await db.$transaction(async (tx) => {
        await tx.refundRequest.update({
          where: { id },
          data: { status: 2 }, // Declined
        });
        await tx.refundActivity.create({
          data: {
            refundRequestId: id,
            sellerId: user.sub,
            message: "Refund request has been declined by the seller.",
          },
        });
      });
      return NextResponse.json({ success: true });
    }

    if (action === "approve") {
      await db.$transaction(async (tx) => {
        // 1. Mark refund as approved
        await tx.refundRequest.update({
          where: { id },
          data: { status: 1 }, // Approved
        });

        // 2. Mark order item as refunded to revoke access
        await tx.orderItem.update({
          where: { id: refund.orderItemId },
          data: { isRefunded: 1 },
        });

        const buyerId = refund.buyerId!;
        const sellerId = refund.userId!;
        const refundAmount = refund.amount; // Total buyer paid
        const sellerEarning = refund.orderItem.sellerEarning; // What seller actually received after fees

        // 3. Debit Seller Balance & Adjust Sales Metrics
        const seller = await tx.user.update({
          where: { id: sellerId },
          data: { 
            balance: { decrement: sellerEarning },
            totalSold: { decrement: 1 },
            totalSoldAmount: { decrement: sellerEarning - refund.orderItem.sellerFee },
          },
        });

        // 3.5 Decrement Product Total Sold
        await tx.product.update({
          where: { id: refund.orderItem.productId },
          data: { totalSold: { decrement: 1 } },
        });

        // 4. Credit Buyer Balance
        const buyer = await tx.user.update({
          where: { id: buyerId },
          data: { balance: { increment: refundAmount } },
        });

        // 5. Create Ledger Transactions
        const trxStr = "REF-" + Date.now().toString();

        await tx.transaction.create({
          data: {
            userId: sellerId,
            amount: sellerEarning,
            charge: 0,
            postBalance: seller.balance,
            trxType: "-",
            trx: trxStr,
            details: `Refund debit for ${refund.orderItem.product.title}`,
            remark: "refund_debit",
          },
        });

        await tx.transaction.create({
          data: {
            userId: buyerId,
            amount: refundAmount,
            charge: 0,
            postBalance: buyer.balance,
            trxType: "+",
            trx: trxStr,
            details: `Refund credit for ${refund.orderItem.product.title}`,
            remark: "refund_credit",
          },
        });

        // 6. Add activity log
        await tx.refundActivity.create({
          data: {
            refundRequestId: id,
            sellerId: user.sub,
            message: "Refund request has been approved. The funds have been returned to the buyer's wallet balance.",
          },
        });
      });

      broadcastNotification("all");
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Process refund error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
