import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Package, FileCode, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DownloadsPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const orderItems = await db.orderItem.findMany({
    where: {
      userId: session.sub,
      isRefunded: 0,
      order: { paymentStatus: 1 },
      refundRequests: {
        none: {
          status: { in: [0, 1] }, // Exclude pending (0) or approved (1) refund requests
        },
      },
    },
    include: {
      product: {
        include: { user: true, category: true },
      },
      order: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Downloads</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {orderItems.length} item{orderItems.length === 1 ? "" : "s"} available for download
        </p>
      </div>

      {orderItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Download className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold">No downloads available</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Purchase a product to access its source code here
            </p>
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[calc(100vh-270px)] min-h-[380px] overflow-y-auto pr-1">
          {orderItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex gap-4 p-4">
                {/* Image */}
                <Link
                  href={`/game-source-code/${item.product.slug}`}
                  className="shrink-0"
                >
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-muted relative">
                    <Image
                      src={
                        item.product.thumbnail ||
                        "/products/placeholder.svg"
                      }
                      alt={item.product.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-2">
                  <Link
                    href={`/game-source-code/${item.product.slug}`}
                    className="font-medium text-sm hover:text-primary line-clamp-2 block"
                  >
                    {item.product.title}
                  </Link>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {item.license === 1 ? "Personal" : "Commercial"}
                    </Badge>
                    {item.isExtended === 1 && (
                      <Badge variant="secondary" className="text-xs">
                        Extended
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground font-mono">
                    Code: {item.purchaseCode?.slice(0, 24)}...
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Purchased{" "}
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="default" asChild>
                      <a href={`/api/download/${item.product.id}`} download>
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Download
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/game-source-code/${item.product.slug}`}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer with file info */}
              <div className="px-4 py-2 bg-accent/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileCode className="h-3 w-3" />
                  Unity Source Code · ZIP
                </span>
                <span>Order: {item.order?.trx?.slice(-8)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {orderItems.length > 0 && (
        <Card className="bg-accent/30">
          <CardContent className="p-4 text-sm">
            <p className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <strong>License Information:</strong> Each purchase includes future
              updates and 3 months of support. Keep your purchase code safe for
              license verification when publishing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
