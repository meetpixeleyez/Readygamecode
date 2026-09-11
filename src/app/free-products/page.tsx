import Link from "next/link";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Gift, ArrowRight, Sparkles } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const title = "Free Game Source Codes — Download Free Unity Templates";
  const description = "Download free Unity game source codes and templates. Free game codes with AdMob integration, ready to publish.";
  
  return {
    title,
    description,
    alternates: {
      canonical: "/free-products",
    },
    openGraph: {
      title: `${title} | Ready Game Code`,
      description,
    },
  };
}

export default async function FreeProductsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://readygamecode.com";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Free Products",
        "item": `${baseUrl}/free-products`
      }
    ]
  };

  const categories = await db.category.findMany({
    where: { status: 1 },
    include: {
      products: {
        where: { status: 1, isFree: 1 },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const allFree = await db.product.findMany({
    where: { status: 1, isFree: 1 },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <JsonLd data={[breadcrumbSchema]} />
      {/* Header */}
      <div className="text-center mb-10">
        <Badge variant="secondary" className="mb-3">
          <Gift className="h-3 w-3 mr-1" />
          100% Free
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold">
          Free Game Source Codes
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Download free Unity game templates with full source code. Perfect for
          learning, prototyping, or launching your first game.
        </p>
      </div>

      {/* CTA banner */}
      <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/20 p-6 mb-8 text-center">
        <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
        <h2 className="font-semibold text-lg">
          {allFree.length} Free Products Available
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          No payment required — just register and download.
        </p>
      </div>

      {/* All free products */}
      {allFree.length === 0 ? (
        <div className="text-center py-16 rounded-lg border border-dashed border-border">
          <Gift className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold">No free products available</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Check back later or browse our premium products.
          </p>
          <Button asChild>
            <Link href="/products">
              Browse Premium Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* By category */}
          {categories.map((cat) => {
            if (cat.products.length === 0) return null;
            return (
              <section key={cat.id}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{cat.name}</h2>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/products?category=${cat.id}`}>
                      View All {cat.name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {cat.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
