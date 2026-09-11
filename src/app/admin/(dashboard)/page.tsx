import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import {
  Users,
  Package,
  Clock,
  DollarSign,
  Download,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getCurrentUser();

  const [
    totalUsers,
    totalSellers,
    totalProducts,
    pendingProducts,
    pendingWithdrawals,
    totalSalesResult,
    recentOrders,
    recentWithdrawals,
    adminProducts,
    adminStats,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isAuthor: 1 } }),
    db.product.count({ where: { status: 1 } }),
    db.product.count({ where: { status: 0 } }),
    db.withdrawal.count({ where: { status: 0 } }),
    db.order.aggregate({ _sum: { amount: true } }),
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { username: true, email: true } },
      },
    }),
    db.withdrawal.findMany({
      take: 5,
      where: { status: 0 },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { username: true, balance: true } },
      },
    }),
    db.product.count({ where: { userId: session?.sub || "" } }),
    db.user.findUnique({
      where: { id: session?.sub || "" },
      select: { totalSold: true, totalSoldAmount: true }
    }),
  ]);

  const totalSales = totalSalesResult._sum.amount || 0;
  const adminRevenue = adminStats?.totalSoldAmount || 0;
  const adminSalesCount = adminStats?.totalSold || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your marketplace activity.
        </p>
      </div>

      {/* Admin's Own Stats (My Statistics) */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">My Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm text-muted-foreground">My Products</h3>
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold">{adminProducts}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Products added by you
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm text-muted-foreground">My Total Sales</h3>
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold">{adminSalesCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Copies sold
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm text-muted-foreground">My Revenue</h3>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(adminRevenue)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Revenue from your products
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Platform Stats Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Platform Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm text-muted-foreground">Total Users</h3>
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalSellers} sellers registered
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm text-muted-foreground">Active Products</h3>
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <div className="text-xs text-muted-foreground mt-1 text-orange-500">
              {pendingProducts} pending approval
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm text-muted-foreground">Total Revenue</h3>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Lifetime platform volume
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm text-muted-foreground">Pending Payouts</h3>
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Download className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold">{pendingWithdrawals}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Withdrawal requests waiting
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="rounded-lg border border-border bg-card flex flex-col">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Recent Orders</h3>
          </div>
          <div className="p-0">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No orders yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{order.trx}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        By {order.user.username || order.user.email}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{formatCurrency(order.amount)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {order.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className="rounded-lg border border-border bg-card flex flex-col">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-orange-500 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Action Needed: Withdrawals
            </h3>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/withdrawals">View All</Link>
            </Button>
          </div>
          <div className="p-0">
            {recentWithdrawals.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No pending withdrawals.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentWithdrawals.map((w) => (
                  <div key={w.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{w.user.username}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {w.methodId} &middot; {formatCurrency(w.amount)}
                      </div>
                    </div>
                    <div>
                      <Badge variant="outline" className="text-orange-500 border-orange-500/30">
                        Pending
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
