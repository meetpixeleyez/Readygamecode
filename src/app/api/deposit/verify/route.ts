import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";
import { z } from "zod";

const verifySchema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_order_id: z.string(),
  razorpay_signature: z.string(),
  depositId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, depositId } = parsed.data;

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Process deposit
    const deposit = await db.deposit.findUnique({
      where: { id: depositId },
      include: { user: true },
    });

    if (!deposit || deposit.status === 1) {
      return NextResponse.json({ error: "Deposit not found or already processed" }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      // 1. Mark deposit as success
      await tx.deposit.update({
        where: { id: depositId },
        data: { status: 1 },
      });

      // 2. Increment user balance
      await tx.user.update({
        where: { id: deposit.userId },
        data: { balance: { increment: deposit.amount } },
      });

      // 3. Create transaction record
      await tx.transaction.create({
        data: {
          userId: deposit.userId,
          amount: deposit.amount,
          charge: 0,
          postBalance: deposit.user.balance + deposit.amount,
          trxType: "+",
          trx: deposit.trx || "DEP-" + Date.now().toString(),
          details: "Deposit via Razorpay",
          remark: "deposit",
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deposit verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
