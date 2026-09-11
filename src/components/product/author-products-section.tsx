"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/product/add-to-cart";
import { FavoriteButton } from "@/components/FavoriteButton";

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  thumbnail?: string | null;
  inlinePreviewImage?: string | null;
  avgRating: number;
  totalReview: number;
  totalSold: number;
  user?: {
    username?: string | null;
    firstname?: string | null;
    lastname?: string | null;
  } | null;
  campaignProducts?: {
    discountPercentage: number;
    campaign: { status: number; startDate: Date | string; endDate: Date | string };
  }[];
}

interface AuthorProductsSectionProps {
  authorName: string;
  products: Product[];
  isAdmin?: boolean;
}

export function AuthorProductsSection({ authorName, products, isAdmin = false }: AuthorProductsSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  if (!products || products.length === 0) return null;

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  return (
    <section className="mt-16">
      {/* Header with Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">More items by {authorName}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Explore other game templates & source codes by {authorName} ({products.length} total)
          </p>
        </div>
      </div>

      {/* Grid of Products (5 per row on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 transition-all duration-300">
        {currentProducts.map((p) => {
          const itemAuthor = p.user?.username || authorName || "Ready Game Code";
          const imageSrc = p.thumbnail || "/products/placeholder.svg";

          // Calculate Active Discount if available
          let activeDiscount = 0;
          if (p.campaignProducts && p.campaignProducts.length > 0) {
            const now = new Date();
            const activeCampaign = p.campaignProducts.find((cp) => {
              const start = new Date(cp.campaign.startDate);
              const end = new Date(cp.campaign.endDate);
              return cp.campaign.status === 1 && start <= now && end >= now;
            });
            if (activeCampaign) {
              activeDiscount = activeCampaign.discountPercentage;
            }
          }

          const discountedPrice = activeDiscount > 0
            ? p.price - (p.price * activeDiscount) / 100
            : p.price;

          const cleanSlug = p.slug ? p.slug.replace(/-+$/, "") : p.id;

          return (
            <div
              key={p.id}
              className="group rounded-lg border border-border/80 bg-card overflow-hidden card-hover flex flex-col justify-between"
            >
              <div>
                {/* Image Section: 860x450 aspect ratio */}
                <div className="relative aspect-[860/450] bg-muted/40 overflow-hidden">
                  <Image
                    src={imageSrc}
                    alt={p.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Live Preview overlay */}
                  <Link
                    href={`/game-source-code/${cleanSlug}`}
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <span className="bg-background/90 text-foreground px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-md">
                      <Eye className="h-3.5 w-3.5" />
                      Live Preview
                    </span>
                  </Link>

                  {/* Favorite Button Overlay */}
                  {!isAdmin && (
                    <div className="absolute top-2 right-2 z-10 bg-background/80 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <FavoriteButton productId={p.id} initialIsFavorited={false} size={15} />
                    </div>
                  )}

                  {/* Sale Badge */}
                  {activeDiscount > 0 && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="bg-gradient-to-r from-red-600 to-amber-600 text-white border-none shadow-sm text-xs">
                        SALE {activeDiscount}%
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-2">
                  <Link
                    href={`/game-source-code/${cleanSlug}`}
                    className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors min-h-[2.1rem] block leading-tight"
                  >
                    {p.title}
                  </Link>

                  <Link
                    href={`/authors/${itemAuthor}`}
                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors block truncate"
                  >
                    by {itemAuthor}
                  </Link>

                  {/* Rating + Sales */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <span className="font-medium text-foreground">{p.avgRating.toFixed(1)}</span>
                      <span>({p.totalReview})</span>
                    </div>
                    <span>{p.totalSold} Sales</span>
                  </div>
                </div>
              </div>

              {/* Price + Cart Footer */}
              <div className="p-2.5 pt-0">
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex flex-col">
                    {activeDiscount > 0 && (
                      <span className="text-[11px] text-muted-foreground line-through">
                        ${p.price.toFixed(2)}
                      </span>
                    )}
                    <span className="font-bold text-base text-primary">
                      ${discountedPrice.toFixed(2)}
                    </span>
                  </div>
                  {!isAdmin && (
                    <AddToCartButton
                      productId={p.id}
                      variant="outline"
                      size="sm"
                      label="Add"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-4 border-t border-border/40">
          <span className="text-xs font-medium text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentPage === pageNum
                    ? "w-8 bg-primary"
                    : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
                aria-label={`Go to page ${pageNum}`}
              />
            ))}
          </div>

          {/* Prev / Next Buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-border hover:bg-accent"
              onClick={handlePrev}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-border hover:bg-accent"
              onClick={handleNext}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
