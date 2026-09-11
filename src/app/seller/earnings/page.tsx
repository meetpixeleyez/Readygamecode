import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DollarSign, TrendingUp, TrendingDown, ArrowRight, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      balance: true,
      totalSold: true,
      totalSoldAmount: true,
    },
  });
  if (!user) return null;

  // Get all transactions (sale credits + seller fee debits)
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Calculate totals
  const credits = transactions.filter((t) => t.trxType === "+");
  const debits = transactions.filter((t) => t.trxType === "-");
  const totalCredits = credits.reduce((s, t) => s + t.amount, 0);
  const totalDebits = debits.reduce((s, t) => s + t.amount, 0);

  // Get order items (sales) with product info
  const orderItems = await db.orderItem.findMany({
    where: { product: { userId: user.id } },
    include: {
      product: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const remarkLabels: Record<string, string> = {
    new_sale: "Sale",
    seller_fee: "Seller Fee",
    payment: "Payment",
    purchase: "Purchase",
    balance_add: "Balance Added",
    withdrawal: "Withdrawal",
    refund_debit: "Refund Debit",
    refund_credit: "Refund Credit",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your sales, revenue, and transaction history
        </p>
      </div>

      {/* Balance card */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-3xl font-bold text-primary mt-1">
                ${user.balance.toFixed(2)}
              </p>
            </div>
            <Button asChild>
              <Link href="/seller/withdrawals">
                <Download className="mr-2 h-4 w-4" />
                Request Withdrawal
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${user.totalSoldAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              from {user.totalSold} sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Credits
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              +${totalCredits.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {credits.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Debits
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              -${totalDebits.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {debits.length} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent sales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {orderItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No sales yet. Once buyers purchase your products, sales will appear here.
            </p>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-accent/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/game-source-code/${item.product.slug}`}
                      className="font-medium text-sm hover:text-primary line-clamp-1 block"
                    >
                      {item.product.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>·</span>
                      <span>{item.license === 1 ? "Personal" : "Commercial"}</span>
                      {item.isExtended === 1 && <span>· Extended</span>}
                      {item.reskinSelected === 1 && <span>· Reskin</span>}
                      {item.publishSelected === 1 && <span>· Publish</span>}
                      {item.storeOptimizationSelected === 1 && <span>· Store Opt</span>}
                      {item.isRefunded === 1 && (
                        <Badge variant="destructive" className="text-[11px] bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 font-semibold px-2 py-0.5 rounded-full">
                          Refunded
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {item.isRefunded === 1 ? (
                      <div>
                        <div className="font-bold text-muted-foreground/70 text-xs line-through">
                          +${item.sellerEarning.toFixed(2)}
                        </div>
                        <div className="text-xs text-rose-500 dark:text-rose-400 font-semibold">
                          $0.00 (Refunded)
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-primary text-sm">
                          +${item.sellerEarning.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${item.productPrice.toFixed(2)} - ${item.sellerFee.toFixed(2)} fee
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

      {/* Transaction ledger */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No transactions yet.
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{t.details}</span>
                      <Badge variant="secondary" className="text-xs">
                        {remarkLabels[t.remark || ""] || t.remark}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(t.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {t.trx && (
                        <>
                          {" · "}Trx: <code className="font-mono">{t.trx.slice(-12)}</code>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`font-bold text-sm ${
                        t.trxType === "+" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {t.trxType === "+" ? "+" : "-"}${t.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Bal: ${t.postBalance.toFixed(2)}
                    </div>
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
