import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product/product-card";
import { AuthorProductsSection } from "@/components/product/author-products-section";
import { ProductPurchaseSidebar } from "@/components/product/product-purchase-sidebar";
import { ImageGallery } from "@/components/product/image-gallery";
import { ReviewsSection } from "@/components/review/reviews-section";
import { CommentsSection } from "@/components/review/comments-section";
import { FavoriteButton } from "@/components/FavoriteButton";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Eye,
  Download,
  PlayCircle,
  Users,
  Tag,
  Mail,
} from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const cleanSlug = slug.replace(/-+$/, "");
  const product = await db.product.findFirst({
    where: {
      OR: [
        { slug },
        { slug: cleanSlug },
        { slug: `${cleanSlug}-` },
        { id: slug },
      ],
    },
    include: { user: true, category: true, subCategory: true },
  });

  if (!product) {
    return { title: "Product Not Found" };
  }

  const title = product.metaTitle || product.title;
  const description = product.metaDescription || product.description?.replace(/<[^>]+>/g, "").slice(0, 155);

  let baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  if (!baseUrl) {
    try {
      const headerList = await headers();
      const host = headerList.get("host");
      const proto = headerList.get("x-forwarded-proto") || "https";
      if (host) {
        baseUrl = `${proto}://${host}`;
      }
    } catch {
      baseUrl = "https://readygamecode.com";
    }
  }
  if (!baseUrl) baseUrl = "https://readygamecode.com";
  baseUrl = baseUrl.replace(/\/+$/, "");

  const officialSlug = (product.slug || cleanSlug || slug).replace(/-+$/, "");
  const canonicalUrl = `${baseUrl}/game-source-code/${officialSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: product.previewImage || product.thumbnail ? [{ url: product.previewImage || product.thumbnail }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const cleanSlug = slug.replace(/-+$/, "");

  // Auto 301 redirect if URL contains trailing hyphens (SEO Self-Canonical Fix)
  if (slug !== cleanSlug && cleanSlug) {
    redirect(`/game-source-code/${cleanSlug}`);
  }

  const product = await db.product.findFirst({
    where: {
      OR: [
        { slug },
        { slug: cleanSlug },
        { slug: `${cleanSlug}-` },
        { id: slug },
      ],
    },
    include: {
      user: true,
      category: true,
      subCategory: true,
      changelogs: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { comments: true },
      },
    },
  });

  const session = await getCurrentUser();
  const isAdmin = session?.role === "admin" || session?.role === "ADMIN";
  const isAuthor = session?.sub === product?.userId;

  if (!product) {
    notFound();
  }

  // If accessed by old ID or dirty slug, redirect to official clean slug
  const officialSlug = (product.slug || product.id).replace(/-+$/, "");
  if (cleanSlug !== officialSlug && officialSlug) {
    redirect(`/game-source-code/${officialSlug}`);
  }

  // If product is not approved (status 1), only author and admin can view it
  if (product.status !== 1 && !isAdmin && !isAuthor) {
    return (
      <div className="container mx-auto px-4 py-32 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-muted/50 p-6 rounded-full mb-6">
          <Eye className="h-10 w-10 text-muted-foreground opacity-50" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Product Unavailable</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm">
          This product is currently under review, has been taken down, or is otherwise not available for public viewing at this time.
        </p>
        <Button asChild>
          <Link href="/products">
            Browse Other Products
          </Link>
        </Button>
      </div>
    );
  }

  // Increment view count (1 row per product per day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existingView = await db.productView.findFirst({
    where: {
      productId: product.id,
      viewsDate: today,
    },
  });
  if (existingView) {
    await db.productView.update({
      where: { id: existingView.id },
      data: { views: { increment: 1 } },
    });
  } else {
    await db.productView.create({
      data: {
        productId: product.id,
        views: 1,
        viewsDate: today,
      },
    });
  }

  // Check if user has favorited
  let isFavorited = false;
  if (session && session.sub && !isAdmin) {
    const fav = await db.productUser.findFirst({
      where: { userId: session.sub, productId: product.id }
    });
    if (fav) isFavorited = true;
  }

  // Check if user has purchased the item or if it's free (and not refunded / refund pending)
  let hasPurchased = isAdmin || isAuthor || product.isFree === 1;
  if (!hasPurchased && session?.sub) {
    const purchaseCount = await db.orderItem.count({
      where: {
        productId: product.id,
        userId: session.sub,
        isRefunded: 0,
        refundRequests: {
          none: {
            status: { in: [0, 1] }, // Exclude pending (0) or approved (1) refund requests
          },
        },
        order: { paymentStatus: 1 },
      },
    });
    if (purchaseCount > 0) {
      hasPurchased = true;
    }
  }

  // Get more items by the same author
  const moreByAuthor = await db.product.findMany({
    where: {
      userId: product.userId,
      status: 1,
      id: { not: product.id },
    },
    include: {
      user: true,
      campaignProducts: {
        include: { campaign: true },
      },
    },
    take: 24,
    orderBy: { totalSold: "desc" },
  });

  const authorName = product.user?.username || "Ready Game Code";
  const imageSrc = product.inlinePreviewImage || product.thumbnail || "/products/placeholder.svg";
  const tags: string[] = product.tags ? JSON.parse(product.tags) : [];

  // Convert YouTube URL to embed URL
  const youtubeEmbedUrl = product.previewVideo
    ? product.previewVideo.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")
    : null;

  // Compile images for gallery
  let screenshots: string[] = [];
  try {
    if (product.inlinePreviewImage) {
      screenshots = JSON.parse(product.inlinePreviewImage);
      if (!Array.isArray(screenshots)) screenshots = [screenshots];
    }
  } catch(e) {}

  if (screenshots.length === 0 && product.thumbnail) {
    screenshots = [product.thumbnail];
    screenshots = [product.thumbnail, ...screenshots];
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://readygamecode.com";

  const productSchema = {
    "@context": "https://schema.org",
    "@type": ["Product", "SoftwareApplication"],
    "name": product.title,
    "description": product.metaDescription || product.description?.replace(/<[^>]+>/g, "").slice(0, 250),
    "url": `${baseUrl}/game-source-code/${product.slug}`,
    "image": screenshots.length > 0 ? screenshots.map(img => img.startsWith("http") ? img : `${baseUrl}${img}`) : [`${baseUrl}/logo.png`],
    "sku": product.id,
    "mpn": product.id,
    "brand": {
      "@type": "Brand",
      "name": "Ready Game Code",
    },
    "category": product.category?.name || "Game Source Code",
    "applicationCategory": "GameApplication",
    "operatingSystem": "Unity, Android, iOS, Windows, macOS",
    "offers": {
      "@type": "Offer",
      "price": product.price.toFixed(2),
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": `${baseUrl}/game-source-code/${product.slug}`,
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      "seller": {
        "@type": "Organization",
        "name": "Ready Game Code",
        "url": baseUrl,
      },
    },
    ...(product.totalReview > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.avgRating.toFixed(1),
        "reviewCount": product.totalReview,
        "bestRating": "5",
        "worstRating": "1",
      }
    } : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Products",
        "item": `${baseUrl}/products`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.category?.name || "Game Code",
        "item": `${baseUrl}/products?category=${encodeURIComponent(product.category?.name || "")}`,
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": product.title,
        "item": `${baseUrl}/game-source-code/${product.slug}`,
      },
    ],
  };

  return (
    <article className="container mx-auto px-4 py-8" itemScope itemType="https://schema.org/Product">
      <JsonLd data={[productSchema, breadcrumbSchema]} />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-primary">Products</Link>
        <span>/</span>
        <Link
          href={`/products?category=${product.categoryId}`}
          className="hover:text-primary"
        >
          {product.category?.name}
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-xs">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Image Gallery */}
          <ImageGallery 
            images={screenshots}
            youtubeEmbedUrl={youtubeEmbedUrl}
            productTitle={product.title}
          />

          {/* Title + actions row */}
          <div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1">
                <h1 className="text-2xl md:text-3xl font-bold">{product.title}</h1>
                {!isAdmin && (
                  <FavoriteButton productId={product.id} initialIsFavorited={isFavorited} size={24} />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-medium text-foreground">
                    {product.avgRating.toFixed(1)}
                  </span>
                  <span>({product.totalReview} reviews)</span>
                </div>
                <span>·</span>
                <span>{product.totalSold} sales</span>
              </div>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 mt-3 text-sm">
              <span className="text-muted-foreground">by</span>
              <Link
                href={`/authors/${authorName}`}
                className="font-medium text-primary hover:underline"
              >
                {authorName}
              </Link>
              {product.user?.isAuthor === 1 && (
                <Badge variant="secondary" className="text-xs">Author</Badge>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="comments">Comments ({product._count.comments})</TabsTrigger>
              <TabsTrigger value="changelog">Changelog</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-4">
              <div
                className="product-description-content prose prose-sm md:prose-base max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: product.description || "<p>No description available.</p>",
                }}
              />
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <div className="space-y-8">
                {/* Reviews subsection */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Reviews</h3>
                  <ReviewsSection
                    productId={product.id}
                    initialAvgRating={product.avgRating}
                    initialTotalReview={product.totalReview}
                    userId={session?.sub}
                  />
                </div>

                <Separator />

                {/* Comments subsection */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Comments</h3>
                  <CommentsSection productId={product.id} userId={session?.sub} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="changelog" className="mt-4">
              {product.changelogs.length > 0 ? (
                <div className="space-y-4">
                  {product.changelogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-lg border border-border p-4 bg-card"
                    >
                      <h4 className="font-semibold text-sm">{log.heading}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {log.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No changelogs yet.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* Purchase card — interactive client component */}
          <ProductPurchaseSidebar
            isAdmin={session?.role === "admin"}
            product={{
              id: product.id,
              title: product.title,
              slug: product.slug,
              price: product.price,
              priceCl: product.priceCl,
              reskinPrice: product.reskinPrice,
              publishPrice: product.publishPrice,
              storeOptimizationPrice: product.storeOptimizationPrice,
              demoUrl: product.demoUrl,
              demoApk: product.demoApk,
              category: product.category ? {
                personalBuyerFee: product.category.personalBuyerFee,
                commercialBuyerFee: product.category.commercialBuyerFee,
                twelveMonthExtendedFee: product.category.twelveMonthExtendedFee,
              } : null,
              hasPurchased,
              fileUrl: `/api/download/${product.id}`,
            }}
          />

          {/* Author card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h4 className="font-semibold text-sm mb-3">Author</h4>
            <Link
              href={`/authors/${authorName}`}
              className="flex items-center gap-3 hover:bg-accent/50 -mx-2 px-2 py-2 rounded-md transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-primary">
                  {authorName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-medium text-sm">{authorName}</div>
                <div className="text-xs text-muted-foreground">
                  {product.user?.totalSold || 0} sales · {product.user?.totalReview || 0} reviews
                </div>
              </div>
            </Link>
            <Button variant="outline" size="sm" className="w-full mt-3" asChild>
              <Link href={`/authors/${authorName}`}>
                View Portfolio
              </Link>
            </Button>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/products?search=${encodeURIComponent(tag)}`}
                    className="text-xs px-2 py-1 rounded-md bg-accent hover:bg-accent/70 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Support contact */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h4 className="font-semibold text-sm mb-3">Need Help?</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Have questions about this source code? Contact the author or our support team.
            </p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/contact">
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* More items by author with pagination */}
      <AuthorProductsSection
        authorName={authorName}
        products={moreByAuthor}
        isAdmin={session?.role === "admin"}
      />
    </article>
  );
}
