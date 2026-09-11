import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Wallet,
  TrendingUp,
  ArrowRight,
  Package,
  Download,
  Star,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.sub },
    include: {
      orders: {
        where: { paymentStatus: 1 },
        include: {
          orderItems: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      cartItems: true,
      orderItems: {
        where: { order: { paymentStatus: 1 } },
        include: { product: true },
      },
    },
  });

  if (!user) return null;

  const totalPurchases = user.orderItems.length;
  const totalSpent = user.orderItems.reduce(
    (sum, item) => sum + item.productPrice + item.buyerFee + item.extendedAmount,
    0
  );
  const isSeller = user.isAuthor === 1;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user.firstname || user.username}!
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your purchases, downloads, and account settings
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingCart}
          label="Total Purchases"
          value={totalPurchases.toString()}
          subtext={`across ${user.orders.length} orders`}
        />
        <StatCard
          icon={Wallet}
          label="Total Spent"
          value={`$${totalSpent.toFixed(2)}`}
          subtext="lifetime"
        />
        <StatCard
          icon={Package}
          label="Cart Items"
          value={user.cartItems.length.toString()}
          subtext={user.cartItems.length > 0 ? "View cart →" : "Empty"}
          href={user.cartItems.length > 0 ? "/cart" : undefined}
        />
        <StatCard
          icon={TrendingUp}
          label="Account Type"
          value={isSeller ? "Seller" : "Buyer"}
          subtext={user.status === 1 ? "Active" : "Banned"}
        />
      </div>

      {/* Seller stats (if applicable) */}
      {isSeller && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seller Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Total Sales</div>
                <div className="text-xl font-bold">{user.totalSold}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Revenue</div>
                <div className="text-xl font-bold text-primary">
                  ${user.totalSoldAmount.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Avg Rating</div>
                <div className="text-xl font-bold flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  {user.avgRating.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Reviews</div>
                <div className="text-xl font-bold">{user.totalReview}</div>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="mt-4">
              <Link href="/seller">
                View Seller Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Orders</CardTitle>
          {user.orders.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/purchases">View All</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {user.orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No purchases yet</p>
              <Button asChild>
                <Link href="/products">
                  Browse Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {user.orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/purchases?order=${order.trx}`}
                  className="flex items-center justify-between border border-border rounded-md p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm font-mono">
                      #{order.trx?.slice(-12)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {order.orderItems.length} item
                      {order.orderItems.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="font-bold text-primary text-sm">
                      ${order.amount.toFixed(2)}
                    </div>
                    <Badge variant="default">Paid</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link href="/dashboard/downloads" className="block p-6">
            <Download className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">My Downloads</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Access all your purchased game source codes
            </p>
          </Link>
        </Card>
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link href="/dashboard/profile" className="block p-6">
            <User className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Profile Settings</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Update your name, email, and account preferences
            </p>
          </Link>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext?: string;
  href?: string;
}) {
  const content = (
    <Card className={href ? "hover:border-primary/50 transition-colors" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-xl md:text-2xl font-bold">{value}</div>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// Need to import User icon
import { User } from "lucide-react";
