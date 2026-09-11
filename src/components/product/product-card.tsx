import Link from "next/link";
import Image from "next/image";
import { Star, Eye, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "./add-to-cart";
import { FavoriteButton } from "@/components/FavoriteButton";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

interface ProductCardProps {
  product: {
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
    };
    campaignProducts?: {
      discountPercentage: number;
      campaign: { status: number; startDate: Date; endDate: Date };
    }[];
  };
  initialIsFavorited?: boolean;
  priority?: boolean;
}

export async function ProductCard({ product, initialIsFavorited, priority = false }: ProductCardProps) {
  const session = await getCurrentUser();
  const isAdmin = session?.role === "admin";
  const authorName = product.user?.username || "Ready Game Code";
  const imageSrc = product.thumbnail || "/products/placeholder.svg";

  let isFavorited = initialIsFavorited;
  if (isFavorited === undefined && session?.sub) {
    const fav = await db.productUser.findFirst({
      where: { userId: session.sub, productId: product.id },
      select: { productId: true },
    });
    isFavorited = !!fav;
  }

  // Check for active campaign discount
  let activeDiscount = 0;
  if (product.campaignProducts) {
    const now = new Date();
    const activeCampaign = product.campaignProducts.find(
      cp => cp.campaign.status === 1 && new Date(cp.campaign.startDate) <= now && new Date(cp.campaign.endDate) >= now
    );
    if (activeCampaign) {
      activeDiscount = activeCampaign.discountPercentage;
    }
  }

  const discountedPrice = activeDiscount > 0 
    ? product.price - (product.price * activeDiscount) / 100 
    : product.price;

  const cleanSlug = product.slug ? product.slug.replace(/-+$/, "") : product.id;

  return (
    <div className="group rounded-2xl border border-border/70 bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/15 hover:border-primary/50 relative flex flex-col justify-between">
      {/* Image Container: 860x450 aspect ratio */}
      <div className="relative aspect-[860/450] bg-muted/30 overflow-hidden">
        <Image
          src={imageSrc}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          priority={priority}
        />

        {/* Live Preview overlay */}
        <Link
          href={`/game-source-code/${cleanSlug}`}
          className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/45 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]"
        >
          <span className="bg-background/95 text-foreground px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl border border-white/20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <Eye className="h-4 w-4 text-primary" />
            Live Preview
          </span>
        </Link>

        {/* Favorite Button Overlay */}
        {!isAdmin && (
          <div className="absolute top-2.5 right-2.5 z-10 bg-background/85 rounded-full p-0.5 backdrop-blur-md opacity-90 group-hover:opacity-100 transition-all duration-300 shadow-sm hover:scale-110">
            <FavoriteButton productId={product.id} initialIsFavorited={!!isFavorited} size={15} />
          </div>
        )}

        {/* Sale Badge */}
        {activeDiscount > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <Badge className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white border-none shadow-md text-[10px] px-2.5 py-0.5 font-bold tracking-wide animate-pulse">
              SALE {activeDiscount}% OFF
            </Badge>
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <Link
            href={`/game-source-code/${cleanSlug}`}
            className="font-bold text-xs sm:text-sm line-clamp-2 hover:text-primary transition-colors min-h-[2.25rem] block leading-snug tracking-tight"
          >
            {product.title}
          </Link>

          <Link
            href={`/authors/${authorName}`}
            className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors block truncate"
          >
            by <span className="text-foreground/90 group-hover:text-primary">{authorName}</span>
          </Link>
        </div>

        {/* Rating + Sales info row */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pt-1">
          <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="font-bold text-primary">{product.avgRating.toFixed(1)}</span>
            <span className="text-muted-foreground/80">({product.totalReview})</span>
          </div>
          <span className="text-muted-foreground/80 font-medium">{product.totalSold} Sales</span>
        </div>

        {/* Price + Add to Cart footer row */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-auto">
          <div className="flex flex-col">
            {activeDiscount > 0 && (
              <span className="text-[11px] text-muted-foreground line-through font-medium">
                ${product.price.toFixed(2)}
              </span>
            )}
            <span className="font-extrabold text-base text-primary tracking-tight">
              ${discountedPrice.toFixed(2)}
            </span>
          </div>
          {!isAdmin && (
            <AddToCartButton
              productId={product.id}
              variant="outline"
              size="sm"
              label="Add"
            />
          )}
        </div>
      </div>
    </div>
  );
}
