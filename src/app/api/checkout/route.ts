import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import Razorpay from "razorpay";
import { revalidatePath } from "next/cache";
import { getPaymentCredentials } from "@/lib/payment-settings";
import { createPayPalOrder } from "@/lib/paypal";

const checkoutSchema = z.object({
  gateway: z.enum(["razorpay", "paypal", "manual_upi", "wallet"]),
});

// POST /api/checkout/process — initializes Razorpay / PayPal order
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please login to checkout", redirectUrl: "/login?redirect=/checkout" },
        { status: 401 }
      );
    }

    const paymentCreds = await getPaymentCredentials();

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const { gateway } = parsed.data;

    if (gateway === "razorpay" && !paymentCreds.razorpayEnabled) {
      return NextResponse.json({ error: "Razorpay is currently disabled by administrator" }, { status: 400 });
    }
    if (gateway === "paypal" && !paymentCreds.paypalEnabled) {
      return NextResponse.json({ error: "PayPal is currently disabled by administrator" }, { status: 400 });
    }

    const userId = user.sub;

    // Load cart items
    const cartItems = await db.cart.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            user: { include: { authorLevels: true } },
            category: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Check user is not buying own products
    const ownProductInCart = cartItems.some((item) => item.product.userId === userId);
    if (ownProductInCart) {
      return NextResponse.json(
        { error: "You cannot purchase your own products" },
        { status: 400 }
      );
    }

    // Calculate order amount
    const amount = cartItems.reduce((sum, item) => {
      const addonPrice =
        (item.reskinSelected ? item.product.reskinPrice : 0) +
        (item.publishSelected ? item.product.publishPrice : 0) +
        (item.storeOptimizationSelected ? item.product.storeOptimizationPrice : 0);
      return sum + item.price + item.buyerFee + item.extendedAmount + addonPrice;
    }, 0);

    // Generate transaction IDs
    const trx = generateTrx(12);
    const methodCode = gateway === "razorpay" ? 110 : gateway === "paypal" ? 101 : 1000;
    const methodCurrency = gateway === "razorpay" || gateway === "manual_upi" ? "INR" : "USD";

    if (gateway === "razorpay") {
      const razorpay = new Razorpay({
        key_id: paymentCreds.razorpayKeyId || "dummy_key",
        key_secret: paymentCreds.razorpayKeySecret || "dummy_secret",
      });

      // Amount in paise
      const amountInPaise = Math.round(amount * 100);
      
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: trx,
        payment_capture: true, // Auto-capture payment upon successful authorization
      });

      // Create PENDING order and deposit
      const pendingOrder = await db.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId,
            amount,
            discount: 0,
            trx,
            paymentStatus: 0, // Pending
          },
        });

        await tx.deposit.create({
          data: {
            userId,
            orderId: order.id,
            methodCode,
            methodCurrency,
            amount,
            charge: 0,
            rate: 1,
            finalAmount: amount,
            trx,
            status: 0, // Pending
            successUrl: "/checkout/thank-you",
            failedUrl: "/checkout",
            // We can store the razorpay order id in extra if needed, but receipt helps us map back
          },
        });
        return order;
      });

      return NextResponse.json({
        success: true,
        provider: "razorpay",
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        internalOrderId: pendingOrder.id,
        trx: pendingOrder.trx,
      });
    }

    if (gateway === "paypal") {
      const paypalOrder = await createPayPalOrder(amount, "USD", trx);

      const pendingOrder = await db.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId,
            amount,
            discount: 0,
            trx,
            paymentStatus: 0, // Pending
          },
        });

        await tx.deposit.create({
          data: {
            userId,
            orderId: order.id,
            methodCode,
            methodCurrency,
            amount,
            charge: 0,
            rate: 1,
            finalAmount: amount,
            trx,
            status: 0, // Pending
            successUrl: "/checkout/thank-you",
            failedUrl: "/checkout",
          },
        });
        return order;
      });

      return NextResponse.json({
        success: true,
        provider: "paypal",
        paypalOrderId: paypalOrder.id,
        clientId: paymentCreds.paypalClientId,
        amount,
        internalOrderId: pendingOrder.id,
        trx: pendingOrder.trx,
      });
    }

    // Default mock behavior for other gateways (Fallback)
    const order = await db.$transaction(async (tx) => {
      let buyerPostBalance = 0;
      const buyer = await tx.user.findUnique({ where: { id: userId } });
      buyerPostBalance = buyer?.balance || 0;

      if (gateway === "wallet") {
        if (!buyer || buyer.balance < amount) {
          throw new Error("Insufficient wallet balance");
        }
        const updatedBuyer = await tx.user.update({
          where: { id: userId },
          data: { balance: { decrement: amount } },
        });
        buyerPostBalance = updatedBuyer.balance;
      }

      const newOrder = await tx.order.create({
        data: {
          userId,
          amount,
          discount: 0,
          trx,
          paymentStatus: 1, // Paid
        },
      });

      for (const item of cartItems) {
        const author = item.product.user;
        const authorLevel = author?.authorLevels?.[0];
        const sellerFeePercent = authorLevel?.fee || 0;
        const sellerFee = (sellerFeePercent / 100) * item.price;
        const addonAmount = (item.reskinSelected ? item.product.reskinPrice : 0) +
          (item.publishSelected ? item.product.publishPrice : 0) +
          (item.storeOptimizationSelected ? item.product.storeOptimizationPrice : 0);
        const sellerEarning = (item.price - (sellerFee + item.discount)) + item.extendedAmount + addonAmount;
        const purchaseCode = `${userId.slice(-6)}-${item.productId.slice(-6)}-${generateTrx(6)}-${Date.now().toString(36)}`;

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            purchaseCode,
            userId,
            productId: item.productId,
            isExtended: item.isExtended,
            extendedAmount: item.extendedAmount,
            productPrice: item.price,
            sellerFee,
            buyerFee: item.buyerFee,
            quantity: 1,
            license: parseInt(item.license),
            discount: item.discount,
            sellerEarning,
            reskinSelected: item.reskinSelected,
            publishSelected: item.publishSelected,
            storeOptimizationSelected: item.storeOptimizationSelected,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { totalSold: { increment: 1 } },
        });

        if (author) {
          await tx.user.update({
            where: { id: author.id },
            data: {
              balance: { increment: sellerEarning },
              totalSold: { increment: 1 },
              totalSoldAmount: { increment: sellerEarning - sellerFee },
            },
          });
          await tx.transaction.create({
            data: {
              userId: author.id,
              amount: sellerEarning,
              charge: 0,
              postBalance: author.balance + sellerEarning,
              trxType: "+",
              trx,
              details: "Sale Amount Added",
              remark: "new_sale",
            },
          });
          if (sellerFee > 0) {
            await tx.transaction.create({
              data: {
                userId: author.id,
                amount: sellerFee,
                charge: 0,
                postBalance: author.balance + sellerEarning - sellerFee,
                trxType: "-",
                trx,
                details: "Seller Fee Subtracted",
                remark: "seller_fee",
              },
            });
          }
        }
      }

      await tx.deposit.create({
        data: {
          userId,
          orderId: newOrder.id,
          methodCode,
          methodCurrency,
          amount,
          charge: 0,
          rate: 1,
          finalAmount: amount,
          trx,
          status: 1,
          successUrl: "/checkout/thank-you",
          failedUrl: "/checkout",
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          amount,
          charge: 0,
          postBalance: buyerPostBalance,
          trxType: "-",
          trx,
          details: gateway === "wallet" ? "Payment via Wallet" : "Payment for Purchase Item",
          remark: "purchase",
        },
      });

      await tx.cart.deleteMany({ where: { userId } });

      return newOrder;
    });

    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      provider: "mock",
      orderTrx: order.trx,
      redirectUrl: `/checkout/thank-you?trx=${order.trx}`,
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    if (error.message === "Insufficient wallet balance") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Generate Laravel-style transaction ID (12-char uppercase alphanumeric)
function generateTrx(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
