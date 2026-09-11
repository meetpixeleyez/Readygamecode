import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Star } from "lucide-react";
import { ProductSellerActions } from "./product-seller-actions";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams: Promise<{ status?: string }>;
}

const statusMap: Record<number, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  0: { label: "Pending", variant: "secondary" },
  1: { label: "Approved", variant: "default" },
  2: { label: "Soft Rejected", variant: "outline" },
  3: { label: "Hard Rejected", variant: "destructive" },
  4: { label: "Down", variant: "outline" },
  5: { label: "Permanent Down", variant: "destructive" },
};

export default async function SellerProductsPage({ searchParams }: ProductsPageProps) {
  const session = await getCurrentUser();
  if (!session) return null;

  const { status: statusFilter } = await searchParams;
  const statusNum = statusFilter ? parseInt(statusFilter) : undefined;

  const products = await db.product.findMany({
    where: {
      userId: session.sub,
      ...(statusNum !== undefined ? { status: statusNum } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      status: true,
      totalSold: true,
      totalReview: true,
      avgRating: true,
      isFeatured: true,
      isFree: true,
      createdAt: true,
      thumbnail: true,
      inlinePreviewImage: true,
      rejections: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { reason: true },
      },
    },
  });

  const allProducts = await db.product.findMany({
    where: { userId: session.sub },
    select: { status: true },
  });
  const statusCounts = allProducts.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} of {allProducts.length} products shown
          </p>
        </div>
        <Button asChild>
          <Link href="/seller/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Upload Product
          </Link>
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/seller/products"
          className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
            !statusFilter ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/70"
          }`}
        >
          All ({allProducts.length})
        </Link>
        {Object.entries(statusMap).map(([status, info]) => {
          const count = statusCounts[parseInt(status)] || 0;
          if (count === 0) return null;
          return (
            <Link
              key={status}
              href={`/seller/products?status=${status}`}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent hover:bg-accent/70"
              }`}
            >
              {info.label} ({count})
            </Link>
          );
        })}
      </div>

      {/* Products list */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold">No products found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {statusFilter
                ? `No ${statusMap[statusNum!]?.label || ""} products.`
                : "Upload your first product to start selling."}
            </p>
            <Button asChild>
              <Link href="/seller/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Upload Product
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-270px)] min-h-[380px] overflow-y-auto pr-1">
          {products.map((product) => {
            const statusInfo = statusMap[product.status] || { label: "Unknown", variant: "outline" as const };
            return (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <Link
                      href={`/game-source-code/${product.slug}`}
                      className="shrink-0"
                    >
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted relative">
                        {product.thumbnail ? (
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/game-source-code/${product.slug}`}
                        className="font-medium text-sm hover:text-primary line-clamp-1 block"
                      >
                        {product.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          ${product.price.toFixed(2)}
                        </span>
                        <span>·</span>
                        <span>{product.totalSold} sales</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          {product.avgRating.toFixed(1)} ({product.totalReview})
                        </span>
                        {product.isFeatured === 1 && (
                          <>
                            <span>·</span>
                            <Badge variant="secondary" className="text-xs">Featured</Badge>
                          </>
                        )}
                        {product.isFree === 1 && (
                          <>
                            <span>·</span>
                            <Badge variant="secondary" className="text-xs">Free</Badge>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploaded{" "}
                        {new Date(product.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      {(product.status === 2 || product.status === 3) && product.rejections && product.rejections.length > 0 && (
                        <div className={`mt-2 p-3 rounded-md text-sm ${product.status === 3 ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'} border`}>
                          <span className="font-semibold block mb-1">
                            {product.status === 3 ? 'Permanent Rejection Reason:' : 'Required Changes (Soft Reject):'}
                          </span>
                          {product.rejections[0].reason}
                        </div>
                      )}
                    </div>

                    {/* Status + actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={statusInfo.variant} className="text-xs">
                        {statusInfo.label}
                      </Badge>
                        <ProductSellerActions productId={product.id} slug={product.slug!} status={product.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
