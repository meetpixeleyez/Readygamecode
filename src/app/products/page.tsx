import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ProductCard } from "@/components/product/product-card";
import { PriceFilter } from "@/components/product/price-filter";
import { DateFilter } from "@/components/product/date-filter";
import { SubCategoryFilter } from "@/components/product/subcategory-filter";
import { ProductPagination } from "@/components/product/product-pagination";
import { MobileFilterDrawer } from "@/components/product/mobile-filter-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, SlidersHorizontal } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    min_price?: string;
    max_price?: string;
    category?: string;
    sort_by?: string;
    date_range?: string;
    featured?: string;
    sub_category?: string;
    page?: string;
    limit?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ProductsPageProps) {
  const sp = await searchParams;
  const categoryFilter = sp?.category && sp.category !== "all" ? sp.category : undefined;
  const search = sp?.search || "";

  let title = "Buy Unity Source Codes & Game Templates";
  let description =
    "Browse premium Unity, Android, and iOS game source codes. Ready-to-publish game templates with AdMob integration, easy reskin options, and full documentation.";

  if (categoryFilter) {
    const cat = await db.category.findFirst({
      where: { OR: [{ id: categoryFilter }, { name: { equals: categoryFilter, mode: "insensitive" } }] },
      select: { name: true },
    });
    if (cat) {
      title = `Buy ${cat.name} Game Source Codes & Templates`;
      description = `Explore top-rated ${cat.name} game source codes, Unity projects, and mobile templates ready for publication.`;
    }
  } else if (search) {
    title = `Search Results for "${search}" — Game Source Codes`;
    description = `Find Unity game source codes and templates matching "${search}". High-quality digital assets for game developers.`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: "/products",
    },
    openGraph: {
      title: `${title} | Ready Game Code`,
      description,
      type: "website",
    },
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const sp = await searchParams;
  const search = sp.search || "";
  const minPrice = sp.min_price ? parseFloat(sp.min_price) : undefined;
  const maxPrice = sp.max_price ? parseFloat(sp.max_price) : undefined;
  const categoryFilter = sp.category && sp.category !== "all" ? sp.category : undefined;
  const sortBy = sp.sort_by || "new_item";
  const dateRange = sp.date_range ? parseInt(sp.date_range) : undefined;
  const isFeatured = sp.featured === "true";
  const subCategoryFilter = sp.sub_category && sp.sub_category !== "all" ? sp.sub_category : undefined;

  const page = sp.page ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;
  const limit = sp.limit ? Math.max(1, Math.min(100, parseInt(sp.limit, 10) || 12)) : 12;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    status: 1, // approved only
    isFree: 0, // exclude free items from main listing
  };

  if (isFeatured) {
    where.isFeatured = 1;
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { tags: { contains: search } },
      { user: { username: { contains: search } } },
    ];
  }

  if (minPrice !== undefined) where.price = { ...where.price, gte: minPrice };
  if (maxPrice !== undefined) where.price = { ...where.price, lte: maxPrice };
  if (categoryFilter) where.categoryId = categoryFilter;
  if (subCategoryFilter) where.subCategoryId = subCategoryFilter;

  if (dateRange) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - dateRange);
    where.createdAt = { gte: cutoff };
  }

  // Build orderBy
  let orderBy: any = { createdAt: "desc" }; // default: new_item
  if (sortBy === "best_selling") orderBy = { totalSold: "desc" };
  if (sortBy === "best_rated") orderBy = { avgRating: "desc" };

  const [products, filteredTotal, categories, counts, subCategories] = await Promise.all([
    db.product.findMany({
      where,
      include: { user: true, category: true },
      orderBy,
      skip,
      take: limit,
    }),
    db.product.count({ where }),
    db.category.findMany({
      where: { status: 1 },
      orderBy: { name: "asc" },
    }),
    Promise.all([
      db.product.count({ where: { status: 1 } }),
      db.product.count({
        where: { status: 1, createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
      }),
      db.product.count({
        where: { status: 1, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
      db.product.count({
        where: { status: 1, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      db.product.count({
        where: { status: 1, createdAt: { gte: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) } },
      }),
    ]),
    categoryFilter ? db.subCategory.findMany({
      where: { categoryId: categoryFilter, status: 1 },
      orderBy: { name: "asc" },
    }) : Promise.resolve([]),
  ]);

  const [totalAny, totalLastYear, totalLastMonth, totalLastWeek, totalLastDay] = counts;
  const totalPages = Math.ceil(filteredTotal / limit);

  // Fetch logged in user's favorites
  const session = await getCurrentUser();
  let userFavoriteIds = new Set<string>();
  if (session?.sub) {
    const favs = await db.productUser.findMany({
      where: { userId: session.sub },
      select: { productId: true },
    });
    userFavoriteIds = new Set(favs.map((f) => f.productId));
  }

  // Build URL helper for filter links
  function buildUrl(params: Record<string, string | undefined>) {
    const searchParams = new URLSearchParams();
    if (limit !== 12) searchParams.set("limit", limit.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (v) searchParams.set(k, v);
    });
    return `/products?${searchParams.toString()}`;
  }

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
        "name": "Products",
        "item": `${baseUrl}/products`
      }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <JsonLd data={[breadcrumbSchema]} />
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">All Products</h1>
        <p className="text-muted-foreground mt-1">
          {filteredTotal > 0
            ? `Showing ${Math.min(skip + 1, filteredTotal)}–${Math.min(skip + products.length, filteredTotal)} of ${filteredTotal} products`
            : "No products found"}
        </p>
      </div>

      {/* Mobile Filter Drawer Button */}
      <MobileFilterDrawer activeCount={[search, categoryFilter, subCategoryFilter, minPrice !== undefined ? "1" : "", maxPrice !== undefined ? "1" : "", dateRange ? "1" : ""].filter(Boolean).length}>
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <Search className="h-4 w-4 text-primary" />
              Search
            </h3>
            <form action="/products" method="get" className="space-y-2">
              <Input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search products..."
                className="text-sm"
              />
              <Button type="submit" size="sm" className="w-full">
                Search
              </Button>
            </form>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Price Range</h3>
            <form action="/products" method="get" className="space-y-4">
              {search && <input type="hidden" name="search" value={search} />}
              {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
              {subCategoryFilter && <input type="hidden" name="sub_category" value={subCategoryFilter} />}
              {sortBy !== "new_item" && <input type="hidden" name="sort_by" value={sortBy} />}
              {isFeatured && <input type="hidden" name="featured" value="true" />}
              {limit !== 24 && <input type="hidden" name="limit" value={limit} />}
              
              <PriceFilter initialMin={minPrice} initialMax={maxPrice} maxLimit={500} />
              
              <Button type="submit" size="sm" variant="outline" className="w-full">
                Apply Filter
              </Button>
            </form>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Category</h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href={buildUrl({ search, sort_by: sortBy, min_price: sp.min_price, max_price: sp.max_price, featured: sp.featured })}
                  className={`block text-sm px-2 py-1.5 rounded-md hover:bg-accent transition-colors ${
                    !categoryFilter ? "bg-accent font-medium" : "text-muted-foreground"
                  }`}
                >
                  All Categories
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={buildUrl({ search, sort_by: sortBy, category: cat.id, min_price: sp.min_price, max_price: sp.max_price, featured: sp.featured })}
                    className={`block text-sm px-2 py-1.5 rounded-md hover:bg-accent transition-colors ${
                      categoryFilter === cat.id ? "bg-accent font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {categoryFilter && subCategories.length > 0 && (
            <SubCategoryFilter
              subCategories={subCategories}
              categoryFilter={categoryFilter}
              subCategoryFilter={subCategoryFilter}
              search={search}
              sortBy={sortBy}
              minPrice={sp.min_price}
              maxPrice={sp.max_price}
              featured={sp.featured}
            />
          )}

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Date Added</h3>
            <DateFilter 
              counts={{
                any: totalAny,
                year: totalLastYear,
                month: totalLastMonth,
                week: totalLastWeek,
                day: totalLastDay
              }} 
            />
          </div>
        </div>
      </MobileFilterDrawer>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Sidebar filters */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <Search className="h-4 w-4" />
              Search
            </h3>
            <form action="/products" method="get" className="space-y-2">
              <Input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search products..."
                className="text-sm"
              />
              <Button type="submit" size="sm" className="w-full">
                Search
              </Button>
            </form>
          </div>

          {/* Price filter */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Price Range</h3>
            <form action="/products" method="get" className="space-y-4">
              {search && <input type="hidden" name="search" value={search} />}
              {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
              {subCategoryFilter && <input type="hidden" name="sub_category" value={subCategoryFilter} />}
              {sortBy !== "new_item" && <input type="hidden" name="sort_by" value={sortBy} />}
              {isFeatured && <input type="hidden" name="featured" value="true" />}
              {limit !== 24 && <input type="hidden" name="limit" value={limit} />}
              
              <PriceFilter initialMin={minPrice} initialMax={maxPrice} maxLimit={500} />
              
              <Button type="submit" size="sm" variant="outline" className="w-full">
                Apply Filter
              </Button>
            </form>
          </div>

          {/* Category filter */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Category</h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href={buildUrl({ search, sort_by: sortBy, min_price: sp.min_price, max_price: sp.max_price, featured: sp.featured })}
                  className={`block text-sm px-2 py-1.5 rounded-md hover:bg-accent transition-colors ${
                    !categoryFilter ? "bg-accent font-medium" : "text-muted-foreground"
                  }`}
                >
                  All Categories
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={buildUrl({ search, sort_by: sortBy, category: cat.id, min_price: sp.min_price, max_price: sp.max_price, featured: sp.featured })}
                    className={`block text-sm px-2 py-1.5 rounded-md hover:bg-accent transition-colors ${
                      categoryFilter === cat.id ? "bg-accent font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* SubCategory filter - Only show if category is selected and has subcategories */}
          {categoryFilter && subCategories.length > 0 && (
            <SubCategoryFilter
              subCategories={subCategories}
              categoryFilter={categoryFilter}
              subCategoryFilter={subCategoryFilter}
              search={search}
              sortBy={sortBy}
              minPrice={sp.min_price}
              maxPrice={sp.max_price}
              featured={sp.featured}
            />
          )}

          {/* Date filter */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Date Added</h3>
            <DateFilter 
              counts={{
                any: totalAny,
                year: totalLastYear,
                month: totalLastMonth,
                week: totalLastWeek,
                day: totalLastDay
              }} 
            />
          </div>
        </aside>

        {/* Products grid + sort */}
        <div className="lg:col-span-3">
          {/* Sort bar */}
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Sort by:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SortButton active={sortBy === "new_item"} href={buildUrl({ search, category: sp.category, sub_category: sp.sub_category, sort_by: "new_item", date_range: sp.date_range, min_price: sp.min_price, max_price: sp.max_price, featured: sp.featured })}>
                New Item
              </SortButton>
              <SortButton active={sortBy === "best_rated"} href={buildUrl({ search, category: sp.category, sub_category: sp.sub_category, sort_by: "best_rated", date_range: sp.date_range, min_price: sp.min_price, max_price: sp.max_price, featured: sp.featured })}>
                Best Rated
              </SortButton>
              <SortButton active={sortBy === "best_selling"} href={buildUrl({ search, category: sp.category, sub_category: sp.sub_category, sort_by: "best_selling", date_range: sp.date_range, min_price: sp.min_price, max_price: sp.max_price, featured: sp.featured })}>
                Best Selling
              </SortButton>
            </div>
          </div>

          {/* Active filters */}
          {(search || categoryFilter || subCategoryFilter || minPrice !== undefined || maxPrice !== undefined) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {search && (
                <Badge variant="secondary">
                  Search: &quot;{search}&quot;
                </Badge>
              )}
              {categoryFilter && (
                <Badge variant="secondary">
                  Category: {categories.find((c) => c.id === categoryFilter)?.name}
                </Badge>
              )}
              {subCategoryFilter && (
                <Badge variant="secondary">
                  Sub-Category: {subCategories.find((c) => c.id === subCategoryFilter)?.name}
                </Badge>
              )}
              {isFeatured && (
                <Badge variant="secondary">Featured</Badge>
              )}
              {minPrice !== undefined && (
                <Badge variant="secondary">Min: ${minPrice}</Badge>
              )}
              {maxPrice !== undefined && (
                <Badge variant="secondary">Max: ${maxPrice}</Badge>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/products">Clear all</Link>
              </Button>
            </div>
          )}

          {/* Grid */}
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    initialIsFavorited={userFavoriteIds.has(product.id)}
                  />
                ))}
              </div>
              <ProductPagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredTotal}
                pageSize={limit}
              />
            </>
          ) : (
            <div className="text-center py-16 rounded-lg border border-dashed border-border">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">No products found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters or search query.
              </p>
              <Button variant="outline" size="sm" asChild className="mt-4">
                <Link href="/products">Reset filters</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortButton({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-accent hover:bg-accent/70 text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
