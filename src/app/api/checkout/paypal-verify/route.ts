import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { capturePayPalOrder } from "@/lib/paypal";

const paypalVerifySchema = z.object({
  paypalOrderId: z.string(),
  internalOrderId: z.string(),
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
    const parsed = paypalVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { paypalOrderId, internalOrderId } = parsed.data;

    // Load internal order
    const order = await db.order.findUnique({
      where: { id: internalOrderId },
    });

    if (!order || order.paymentStatus === 1) {
      return NextResponse.json({ error: "Order not found or already processed" }, { status: 400 });
    }

    // Capture PayPal order on PayPal servers
    const captureResult = await capturePayPalOrder(paypalOrderId);
    if (captureResult.status !== "COMPLETED") {
      return NextResponse.json({ error: "PayPal payment was not completed" }, { status: 400 });
    }

    const userId = order.userId;
    const buyer = await db.user.findUnique({ where: { id: userId } });
    if (!buyer) return NextResponse.json({ error: "Buyer not found" }, { status: 400 });

    // Load cart items
    const cartItems = await db.cart.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            user: { include: { authorLevels: true } },
            category: true,
            campaignProducts: {
              include: { campaign: true }
            }
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      // 1. Mark order as paid
      await tx.order.update({
        where: { id: internalOrderId },
        data: { paymentStatus: 1 },
      });

      // 2. Process order items
      for (const item of cartItems) {
        const author = item.product.user;
        const authorLevel = author?.authorLevels?.[0];
        const sellerFeePercent = authorLevel?.fee || 0;
        const sellerFee = (sellerFeePercent / 100) * item.price;
        const addonAmount = (item.reskinSelected ? item.product.reskinPrice : 0) +
          (item.publishSelected ? item.product.publishPrice : 0) +
          (item.storeOptimizationSelected ? item.product.storeOptimizationPrice : 0);

        let activeDiscount = item.discount;
        if (item.product.campaignProducts) {
          const now = new Date();
          const activeCampaign = item.product.campaignProducts.find(
            cp => cp.campaign.status === 1 && new Date(cp.campaign.startDate) <= now && new Date(cp.campaign.endDate) >= now
          );
          if (activeCampaign) {
            activeDiscount = (item.price * activeCampaign.discountPercentage) / 100;
          }
        }

        const sellerEarning = (item.price - (sellerFee + activeDiscount)) + item.extendedAmount + addonAmount;
        const purchaseCode = `${userId.slice(-6)}-${item.productId.slice(-6)}-${generateTrx(6)}-${Date.now().toString(36)}`;

        await tx.orderItem.create({
          data: {
            orderId: internalOrderId,
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
            discount: activeDiscount,
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
              trx: order.trx,
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
                trx: order.trx,
                details: "Seller Fee Subtracted",
                remark: "seller_fee",
              },
            });
          }
        }
      }

      // 3. Mark deposit as paid
      await tx.deposit.updateMany({
        where: { orderId: internalOrderId },
        data: { status: 1 },
      });

      // 4. Update buyer balance and create deposit transactions
      const updatedBuyer = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: order.amount } }
      });
      
      await tx.transaction.create({
        data: {
          userId,
          amount: order.amount,
          charge: 0,
          postBalance: updatedBuyer.balance,
          trxType: "+",
          trx: order.trx,
          details: "Funds added via PayPal Checkout",
          remark: "deposit",
        },
      });

      const finalBuyer = await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: order.amount } }
      });

      await tx.transaction.create({
        data: {
          userId,
          amount: order.amount,
          charge: 0,
          postBalance: finalBuyer.balance,
          trxType: "-",
          trx: order.trx,
          details: "Payment for Purchase Item",
          remark: "purchase",
        },
      });

      // 5. Clear cart
      await tx.cart.deleteMany({ where: { userId } });
    });

    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      redirectUrl: `/checkout/thank-you?trx=${order.trx}`,
    });
  } catch (error: any) {
    console.error("PayPal verification error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
