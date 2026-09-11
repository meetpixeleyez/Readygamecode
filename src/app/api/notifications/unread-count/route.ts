import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.sub;

    // Calculate seller unread counts
    const sellerRefunds = await db.refundRequest.aggregate({
      where: { userId },
      _sum: { sellerUnreadCount: true },
    });
    const sellerTickets = await db.supportTicket.aggregate({
      where: { sellerId: userId },
      _sum: { sellerUnreadCount: true },
    });

    // Calculate buyer unread counts
    const buyerRefunds = await db.refundRequest.aggregate({
      where: { buyerId: userId },
      _sum: { buyerUnreadCount: true },
    });
    const buyerTickets = await db.supportTicket.aggregate({
      where: { userId }, // Support tickets created by this user
      _sum: { buyerUnreadCount: true },
    });

    // Calculate admin unread/pending counts if user is an admin
    let adminCounts = { refunds: 0, support: 0, pendingProducts: 0, withdrawals: 0, total: 0 };
    if (user.role === "ADMIN" || user.role === "admin") {
      const [adminRefunds, adminSupport, adminPendingProducts, adminWithdrawals] = await Promise.all([
        db.refundRequest.count({
          where: {
            OR: [
              { userId: userId, sellerUnreadCount: { gt: 0 } },
              { status: 0 },
            ],
          },
        }),
        db.supportTicket.count({
          where: {
            OR: [
              { ticketType: "ADMIN", status: { in: [0, 2] } },
              { sellerId: userId, sellerUnreadCount: { gt: 0 } },
            ],
          },
        }),
        db.product.count({
          where: { status: 0 },
        }),
        db.withdrawal.count({
          where: { status: 0 },
        }),
      ]);

      adminCounts = {
        refunds: adminRefunds,
        support: adminSupport,
        pendingProducts: adminPendingProducts,
        withdrawals: adminWithdrawals,
        total: adminRefunds + adminSupport + adminPendingProducts + adminWithdrawals,
      };
    }

    return NextResponse.json({
      seller: {
        refunds: sellerRefunds._sum.sellerUnreadCount || 0,
        support: sellerTickets._sum.sellerUnreadCount || 0,
        total: (sellerRefunds._sum.sellerUnreadCount || 0) + (sellerTickets._sum.sellerUnreadCount || 0),
      },
      buyer: {
        refunds: buyerRefunds._sum.buyerUnreadCount || 0,
        support: buyerTickets._sum.buyerUnreadCount || 0,
        total: (buyerRefunds._sum.buyerUnreadCount || 0) + (buyerTickets._sum.buyerUnreadCount || 0),
      },
      admin: adminCounts,
    });
  } catch (error) {
    console.error("Fetch unread counts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
