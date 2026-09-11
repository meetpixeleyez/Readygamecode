import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  CreditCard,
  Package,
} from "lucide-react";
import { SalesAndLedgerTables } from "./sales-and-ledger-tables";

export const dynamic = "force-dynamic";

export default async function AdminMySalesPage() {
  const session = await getCurrentUser();
  if (!session || (session.role !== "admin" && session.role !== "ADMIN")) {
    redirect("/admin/login");
  }

  const userId = session.sub;

  const [user, orderItems, transactions, myProductsCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { balance: true, totalSold: true, totalSoldAmount: true },
    }),
    db.orderItem.findMany({
      where: { product: { userId } },
      include: {
        product: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, username: true, email: true, firstname: true, lastname: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.product.count({ where: { userId } }),
  ]);

  const activeOrderItems = orderItems.filter((item) => item.isRefunded === 0);
  const totalSalesCount = user?.totalSold !== undefined ? user.totalSold : activeOrderItems.length;
  const totalEarnedAmount = user?.totalSoldAmount !== undefined
    ? user.totalSoldAmount
    : activeOrderItems.reduce((sum, item) => sum + (item.sellerEarning || item.productPrice), 0);

  const remarkLabels: Record<string, string> = {
    new_sale: "Product Sale",
    seller_fee: "Platform Fee",
    payment: "Payment Received",
    purchase: "Item Purchased",
    balance_add: "Balance Added",
    withdrawal: "Withdrawal",
    refund_debit: "Refund Debit",
    refund_credit: "Refund Credit",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Sales &amp; Earnings</h1>
        <p className="text-muted-foreground mt-1">
          Unified overview of product sales, buyer orders, and financial transactions.
        </p>
      </div>

      {/* 4-Grid Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Sales Revenue</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalEarnedAmount)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Orders Sold</p>
            <p className="text-xl font-bold">{totalSalesCount}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Available Balance</p>
            <p className="text-xl font-bold">{formatCurrency(user?.balance || 0)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">My Uploaded Products</p>
            <p className="text-xl font-bold">{myProductsCount}</p>
          </div>
        </div>
      </div>

      {/* Interactive Filterable Sales & Ledger Tables */}
      <SalesAndLedgerTables orderItems={orderItems} transactions={transactions} />
    </div>
  );
}
