import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function generateTrx(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
    const { status, adminFeedback } = body;

    if (typeof status !== "number" || ![1, 3].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const withdrawal = await db.withdrawal.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!withdrawal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (withdrawal.status !== 0 && withdrawal.status !== 2) {
      return NextResponse.json(
        { error: "Withdrawal is already processed" },
        { status: 400 }
      );
    }

    // Process in a transaction
    await db.$transaction(async (tx) => {
      // Update withdrawal record
      await tx.withdrawal.update({
        where: { id },
        data: {
          status,
          adminFeedback: adminFeedback || null,
        },
      });

      // If rejected (status 3), refund the amount to user's balance
      if (status === 3) {
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: { balance: { increment: withdrawal.amount } },
        });

        // Create a transaction record for the refund
        await tx.transaction.create({
          data: {
            userId: withdrawal.userId,
            amount: withdrawal.amount,
            postBalance: withdrawal.user.balance + withdrawal.amount,
            charge: 0,
            trxType: "+",
            details: "Refund for rejected withdrawal request",
            remark: "withdrawal_rejected",
            trx: generateTrx(),
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update withdrawal status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
