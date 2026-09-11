import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Package, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface PurchasesPageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function PurchasesPage({ searchParams }: PurchasesPageProps) {
  const session = await getCurrentUser();
  if (!session) return null;

  const { order: filterTrx } = await searchParams;

  const orders = await db.order.findMany({
    where: {
      userId: session.sub,
      paymentStatus: 1,
      ...(filterTrx ? { trx: filterTrx } : {}),
    },
    include: {
      orderItems: {
        include: {
          product: {
            include: { user: true },
          },
          refundRequests: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Purchase History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {orders.length} order{orders.length === 1 ? "" : "s"} ·{" "}
          {orders.reduce((sum, o) => sum + o.orderItems.length, 0)} items total
        </p>
      </div>

      {filterTrx && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/purchases">← View All Orders</Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Filtered by: <code className="font-mono">{filterTrx}</code>
          </span>
        </div>
      )}

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold">No purchases yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Browse our marketplace to find premium game source codes
            </p>
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 max-h-[calc(100vh-270px)] min-h-[380px] overflow-y-auto pr-1">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-sm font-mono">
                      Order #{order.trx}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="default">Paid</Badge>
                    <div className="text-lg font-bold text-primary">
                      ${order.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {order.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 items-center p-2 rounded-md hover:bg-accent/30 transition-colors"
                    >
                      <Link
                        href={`/game-source-code/${item.product.slug}`}
                        className="shrink-0"
                      >
                        <div className="w-14 h-14 rounded-md overflow-hidden bg-muted relative">
                          <Image
                            src={
                              item.product.thumbnail ||
                              "/products/placeholder.svg"
                            }
                            alt={item.product.title}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/game-source-code/${item.product.slug}`}
                          className="text-sm font-medium hover:text-primary line-clamp-1"
                        >
                          {item.product.title}
                        </Link>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.license === 1 ? "Personal" : "Commercial"}
                          </Badge>
                          {item.isExtended === 1 && (
                            <Badge variant="secondary" className="text-xs">
                              Extended
                            </Badge>
                          )}
                          {item.reskinSelected === 1 && (
                            <Badge variant="secondary" className="text-xs">
                              Reskin
                            </Badge>
                          )}
                          {item.publishSelected === 1 && (
                            <Badge variant="secondary" className="text-xs">
                              Publish
                            </Badge>
                          )}
                          {item.storeOptimizationSelected === 1 && (
                            <Badge variant="secondary" className="text-xs">
                              Store Opt
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          Code: {item.purchaseCode}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-medium text-sm">
                          ${item.productPrice.toFixed(2)}
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                          {item.isRefunded === 1 ? (
                            <Badge variant="destructive" className="justify-center py-1">Access Revoked (Refunded)</Badge>
                          ) : item.refundRequests.length > 0 ? (
                            <>
                              <Badge variant="outline" className="justify-center text-amber-600 border-amber-500/30 bg-amber-500/10 text-[11px]">
                                Download Disabled (Refund Pending)
                              </Badge>
                              <Button size="sm" variant="secondary" asChild>
                                <Link href={`/dashboard/refunds/${item.refundRequests[0].id}`}>
                                  View Dispute
                                </Link>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" asChild>
                                <a href={`/api/download/${item.product.id}`} download>
                                  <Download className="h-3.5 w-3.5 mr-1" />
                                  Download
                                </a>
                              </Button>
                              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive text-xs" asChild>
                                <Link href={`/dashboard/refunds/new?item=${item.id}`}>
                                  Request Refund
                                </Link>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
