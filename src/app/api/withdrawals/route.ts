import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const withdrawalSchema = z.object({
  amount: z.number().min(5, "Minimum withdrawal is $5"),
  method: z.enum(["google_pay", "bank_transfer", "paypal"]),
  accountInfo: z.string().min(1, "Account information is required").max(2000),
});

function generateTrx(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET /api/withdrawals — list user's withdrawals
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const withdrawals = await db.withdrawal.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error("GET withdrawals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/withdrawals — create withdrawal request
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = withdrawalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.sub },
      select: { id: true, balance: true, status: true, isAuthor: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.status !== 1) {
      return NextResponse.json({ error: "Account not active" }, { status: 403 });
    }

    if (user.isAuthor !== 1) {
      return NextResponse.json(
        { error: "Only authors can request withdrawals" },
        { status: 403 }
      );
    }

    if (parsed.data.amount > user.balance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Check for pending withdrawals (one at a time)
    const pending = await db.withdrawal.findFirst({
      where: { userId: user.id, status: { in: [0, 2] } },
    });
    if (pending) {
      return NextResponse.json(
        { error: "You have a pending withdrawal request. Please wait for it to be processed." },
        { status: 400 }
      );
    }

    // Calculate charge (1% fee, min $1)
    const charge = Math.max(1, parsed.data.amount * 0.01);
    const finalAmount = parsed.data.amount - charge;

    // Create withdrawal in transaction
    const withdrawal = await db.$transaction(async (tx) => {
      // Deduct from user balance immediately
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: parsed.data.amount } },
        select: { balance: true },
      });

      // Create withdrawal record
      const newWithdrawal = await tx.withdrawal.create({
        data: {
          methodId: "manual", // placeholder
          userId: user.id,
          amount: parsed.data.amount,
          currency: "USD",
          rate: 1,
          charge,
          trx: generateTrx(),
          finalAmount,
          afterCharge: finalAmount,
          withdrawInformation: JSON.stringify({
            method: parsed.data.method,
            accountInfo: parsed.data.accountInfo,
          }),
          status: 0, // PENDING
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: user.id,
          amount: parsed.data.amount,
          charge,
          postBalance: updatedUser.balance,
          trxType: "-",
          trx: newWithdrawal.trx,
          details: "Withdrawal Request",
          remark: "withdrawal",
        },
      });

      return newWithdrawal;
    });

    // Create admin notification
    await db.adminNotification.create({
      data: {
        userId: user.id,
        title: `New withdrawal request from ${user.id}`,
        clickUrl: `/admin/withdraw/details/${withdrawal.id}`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        withdrawal: {
          id: withdrawal.id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          trx: withdrawal.trx,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST withdrawal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
