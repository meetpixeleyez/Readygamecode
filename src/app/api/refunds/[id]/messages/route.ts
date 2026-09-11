import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { broadcastNotification } from "@/lib/sse";

const replySchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { message } = parsed.data;

    const refund = await db.refundRequest.findUnique({
      where: { id },
    });

    if (!refund) {
      return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
    }

    if (refund.status !== 0) {
      return NextResponse.json({ error: "Cannot reply to a closed refund request" }, { status: 400 });
    }

    // Verify user is buyer, seller, or admin
    const isAdmin = user.role === "ADMIN" || user.role === "admin";
    const isBuyer = refund.buyerId === user.sub;
    const isSeller = refund.userId === user.sub || isAdmin;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await db.$transaction(async (tx) => {
      await tx.refundActivity.create({
        data: {
          refundRequestId: refund.id,
          message,
          buyerId: isBuyer ? user.sub : null,
          sellerId: isSeller ? user.sub : null,
        },
      });

      await tx.refundRequest.update({
        where: { id: refund.id },
        data: {
          sellerUnreadCount: isBuyer ? { increment: 1 } : undefined,
          buyerUnreadCount: isSeller ? { increment: 1 } : undefined,
        },
      });
    });

    // Notify all via SSE
    broadcastNotification("all");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Refund reply error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
