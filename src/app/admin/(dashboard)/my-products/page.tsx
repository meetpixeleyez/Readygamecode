import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "../products/product-actions";
import { formatCurrency } from "@/lib/utils";
import { Plus, Package, DollarSign, TrendingUp, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

interface AdminMyProductsPageProps {
  searchParams: Promise<{ status?: string }>;
}

const statusMap: Record<number, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  0: { label: "Pending", variant: "secondary" },
  1: { label: "Approved", variant: "default" },
  2: { label: "Soft Rejected", variant: "outline" },
  3: { label: "Hard Rejected", variant: "destructive" },
  4: { label: "Down", variant: "outline" },
};

export default async function AdminMyProductsPage({ searchParams }: AdminMyProductsPageProps) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "admin" && session.role !== "ADMIN")) {
    redirect("/admin/login");
  }

  const { status: statusFilter } = await searchParams;
  const statusNum = statusFilter ? parseInt(statusFilter, 10) : undefined;

  const products = await db.product.findMany({
    where: {
      userId: session.sub,
      ...(statusNum !== undefined ? { status: statusNum } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const allMyProducts = await db.product.findMany({
    where: { userId: session.sub },
    select: { status: true, totalSold: true, price: true },
  });

  const totalMyProducts = allMyProducts.length;
  const totalMySales = allMyProducts.reduce((sum, p) => sum + p.totalSold, 0);
  const totalMyEstRevenue = allMyProducts.reduce((sum, p) => sum + p.totalSold * p.price, 0);

  const statusCounts = allMyProducts.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your uploaded game codes, track individual product sales &amp; revenue.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Upload Product
          </Link>
        </Button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">My Products</p>
            <p className="text-xl font-bold">{totalMyProducts}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Units Sold</p>
            <p className="text-xl font-bold">{totalMySales}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Est. Product Revenue</p>
            <p className="text-xl font-bold">{formatCurrency(totalMyEstRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Status Filter Badges */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Link
          href="/admin/my-products"
          className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            statusNum === undefined
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All ({totalMyProducts})
        </Link>
        <Link
          href="/admin/my-products?status=1"
          className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            statusNum === 1
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Approved ({statusCounts[1] || 0})
        </Link>
        <Link
          href="/admin/my-products?status=4"
          className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            statusNum === 4
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Down ({statusCounts[4] || 0})
        </Link>
      </div>

      {/* Products Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {products.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
            <p className="font-semibold text-foreground">No products found</p>
            <p className="text-xs mt-1">You haven&apos;t uploaded any products in this status yet.</p>
            <Button size="sm" variant="outline" asChild className="mt-4">
              <Link href="/admin/products/new">Upload Your First Product</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[480px] min-h-[440px] relative">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="text-xs text-muted-foreground bg-muted/95 backdrop-blur-xs uppercase border-b border-border sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Total Sold</th>
                  <th className="px-4 py-3 font-semibold">Est. Revenue</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const statusInfo = statusMap[product.status] || {
                    label: "Unknown",
                    variant: "outline" as const,
                  };
                  const productRevenue = product.totalSold * product.price;

                  return (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 bg-muted rounded overflow-hidden shrink-0 border border-border">
                            {product.thumbnail ? (
                              <Image
                                src={product.thumbnail}
                                alt={product.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full w-full bg-muted text-xs text-muted-foreground">
                                No img
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/game-source-code/${product.slug}`}
                              className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                              target="_blank"
                            >
                              {product.title}
                            </Link>
                            <Link
                              href={`/game-source-code/${product.slug}`}
                              target="_blank"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-0.5 font-medium"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View Store
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {product.totalSold} sales
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(productRevenue)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ProductActions
                          productId={product.id}
                          currentStatus={product.status}
                          isFeatured={product.isFeatured}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
