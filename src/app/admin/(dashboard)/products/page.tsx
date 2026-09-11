import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "./product-actions";
import { formatCurrency } from "@/lib/utils";
import { Eye, ExternalLink, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

interface AdminProductsPageProps {
  searchParams: Promise<{ status?: string }>;
}

const statusMap: Record<number, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  0: { label: "Pending", variant: "secondary" },
  1: { label: "Approved", variant: "default" },
  2: { label: "Soft Rejected", variant: "outline" },
  3: { label: "Hard Rejected", variant: "destructive" },
  4: { label: "Down", variant: "outline" },
};

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const { status: statusFilter } = await searchParams;
  const statusNum = statusFilter ? parseInt(statusFilter) : undefined;

  const products = await db.product.findMany({
    where: {
      ...(statusNum !== undefined ? { status: statusNum } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { username: true, email: true } },
    },
  });

  const allProducts = await db.product.findMany({
    select: { status: true },
  });
  
  const statusCounts = allProducts.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products Management</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage all products on the platform.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Upload Product
          </Link>
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Link
          href="/admin/products"
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            statusNum === undefined
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All Products ({allProducts.length})
        </Link>
        {[0, 1, 2, 3, 4].map((status) => {
          const count = statusCounts[status] || 0;
          return (
            <Link
              key={status}
              href={`/admin/products?status=${status}`}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statusNum === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {statusMap[status].label} ({count})
            </Link>
          );
        })}
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
        {products.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No products found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[500px] min-h-[460px] relative">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-muted-foreground bg-muted/95 backdrop-blur-xs uppercase border-b border-border sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Author</th>
                  <th className="px-6 py-4 font-semibold">Price</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
                          <Image
                            src={product.thumbnail || "/products/placeholder.svg"}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-[200px] lg:max-w-[300px]">
                            {product.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Link 
                              href={`/game-source-code/${product.slug}`}
                              className="text-xs text-primary hover:underline flex items-center"
                              target="_blank"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" /> View Store
                            </Link>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.user.username || product.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.isFree ? "Free" : formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={statusMap[product.status]?.variant || "default"}>
                        {statusMap[product.status]?.label || "Unknown"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ProductActions productId={product.id} currentStatus={product.status} isFeatured={product.isFeatured} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
