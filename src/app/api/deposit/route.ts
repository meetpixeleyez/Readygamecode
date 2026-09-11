import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Razorpay from "razorpay";
import { z } from "zod";

const depositSchema = z.object({
  amount: z.number().positive(),
});

function generateTrx(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = depositSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const { amount } = parsed.data;
    const amountInPaise = Math.round(amount * 100);
    const trx = generateTrx();

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "dummy_key",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
    });

    // Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: trx,
      payment_capture: true, // Auto-capture payment upon successful authorization
    });

    // Create pending Deposit record
    const deposit = await db.deposit.create({
      data: {
        userId: user.sub,
        methodCode: 110, // Razorpay method code used earlier
        methodCurrency: "INR",
        amount: amount,
        charge: 0,
        rate: 1,
        finalAmount: amount,
        trx: trx,
        status: 0, // Pending
      },
    });

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      depositId: deposit.id,
    });
  } catch (error) {
    console.error("Deposit init error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
