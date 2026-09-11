import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Package,
  TrendingUp,
  Star,
  Plus,
  ArrowRight,
  Eye,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.sub },
    include: {
      products: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user || user.isAuthor !== 1) return null;

  // Get sales stats
  const orderItems = await db.orderItem.findMany({
    where: { product: { userId: user.id } },
    include: {
      product: { select: { title: true, slug: true, inlinePreviewImage: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const totalSales = orderItems.length;
  // Use seller's totalSoldAmount for revenue (cumulative)
  const totalRevenue = user.totalSoldAmount;

  // Product status breakdown
  const productStats = await db.product.groupBy({
    by: ["status"],
    where: { userId: user.id },
    _count: { status: true },
  });

  const statusMap: Record<number, string> = {
    0: "Pending",
    1: "Approved",
    2: "Soft Rejected",
    3: "Hard Rejected",
    4: "Down",
    5: "Permanent Down",
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Seller Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your products, track sales, and grow your revenue
          </p>
        </div>
        <Button asChild>
          <Link href="/seller/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Upload Product
          </Link>
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          subtext="lifetime earnings"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Sales"
          value={user.totalSold.toString()}
          subtext="items sold"
        />
        <StatCard
          icon={Package}
          label="Products"
          value={user.products.length.toString()}
          subtext={`${productStats.find((s) => s.status === 1)?._count.status || 0} approved`}
        />
        <StatCard
          icon={Star}
          label="Rating"
          value={user.avgRating.toFixed(1)}
          subtext={`${user.totalReview} reviews`}
        />
      </div>

      {/* Balance card */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/20">
        <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-3xl font-bold text-primary mt-1">
              ${user.balance.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Available for withdrawal
            </p>
          </div>
          <Button asChild>
            <Link href="/seller/withdrawals">
              Request Withdrawal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Sales</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/seller/earnings">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {orderItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No sales yet. Upload a product to start selling!
              </p>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/game-source-code/${item.product.slug}`}
                        className="font-medium hover:text-primary line-clamp-1 block"
                      >
                        {item.product.title}
                      </Link>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>{item.license === 1 ? "Personal" : "Commercial"}</span>
                        {item.isRefunded === 1 && (
                          <Badge variant="destructive" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/30 py-0">
                            Refunded
                          </Badge>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {item.isRefunded === 1 ? (
                        <div>
                          <div className="font-bold text-muted-foreground text-sm line-through">
                            +${item.sellerEarning.toFixed(2)}
                          </div>
                          <div className="text-xs text-red-500 font-semibold">
                            $0.00 (Refunded)
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-primary text-sm">
                            +${item.sellerEarning.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${item.productPrice.toFixed(2)} sale
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Product Status</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/seller/products">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {productStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No products yet.
              </p>
            ) : (
              <div className="space-y-2">
                {productStats.map((stat) => (
                  <div
                    key={stat.status}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {statusMap[stat.status] || `Status ${stat.status}`}
                    </span>
                    <Badge
                      variant={
                        stat.status === 1
                          ? "default"
                          : stat.status === 0
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {stat._count.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Products</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/seller/products">Manage Products</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {user.products.length === 0 ? (
            <div className="text-center py-6">
              <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No products uploaded yet
              </p>
              <Button size="sm" asChild>
                <Link href="/seller/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Your First Product
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {user.products.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-accent/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/game-source-code/${product.slug}`}
                      className="font-medium text-sm hover:text-primary line-clamp-1 block"
                    >
                      {product.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>${product.price.toFixed(2)}</span>
                      <span>·</span>
                      <span>{product.totalSold} sales</span>
                      <span>·</span>
                      <span>{product.totalReview} reviews</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        product.status === 1
                          ? "default"
                          : product.status === 0
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {statusMap[product.status] || "Unknown"}
                    </Badge>
                    <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                      <Link href={`/game-source-code/${product.slug}`}>
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <Card>
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
}
