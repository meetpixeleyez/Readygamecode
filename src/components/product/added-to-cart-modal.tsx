"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, ArrowLeft, ShoppingBag, User } from "lucide-react";
import Link from "next/link";

export interface AddedItemDetails {
  title: string;
  authorName: string;
  price: number;
  thumbnail?: string;
}

interface AddedToCartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AddedItemDetails | null;
}

export function AddedToCartModal({ open, onOpenChange, item }: AddedToCartModalProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-background/95 backdrop-blur-xl">
        {/* Header Vibrant Gradient Banner */}
        <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-7 text-center text-white relative overflow-hidden">
          {/* Subtle decorative background circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-xl pointer-events-none" />

          {/* Animated checkmark icon container */}
          <div className="relative mx-auto w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-3 shadow-lg shadow-orange-950/20 group">
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-25" />
            <CheckCircle2 className="w-9 h-9 text-white stroke-[2.5]" />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-xs">
            Item added to your cart!
          </h2>
          <p className="text-xs sm:text-sm text-orange-100/90 font-medium mt-1">
            Great choice! Your selection is ready for checkout.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Item Preview Card */}
          <div className="relative border border-border/70 rounded-2xl p-4 bg-muted/30 dark:bg-card/40 backdrop-blur-xs flex items-center gap-4 transition-all duration-200 hover:border-orange-500/30">
            {/* Thumbnail with overlay badge */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-background border border-border/80 shadow-xs">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-accent/50">
                    <ShoppingBag className="w-8 h-8 opacity-70" />
                  </div>
                )}
              </div>
              <div className="absolute -top-2 -right-2 bg-gradient-to-tr from-orange-500 to-amber-500 text-white rounded-full p-1.5 shadow-md border-2 border-background">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Item Details */}
            <div className="space-y-1.5 min-w-0 flex-1">
              <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                <span>by</span>
                <span className="text-foreground font-semibold hover:underline cursor-pointer">
                  {item.authorName}
                </span>
              </p>
              <div className="pt-0.5 flex items-baseline gap-2">
                <span className="font-black text-lg text-orange-500">
                  ${item.price.toFixed(2)}
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  In Stock
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-border/80 font-semibold text-xs sm:text-sm hover:bg-accent/80 hover:text-foreground transition-all duration-200"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4 text-muted-foreground" />
              Keep Browsing
            </Button>

            <Button
              size="lg"
              asChild
              className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/25 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/35 hover:-translate-y-0.5"
            >
              <Link href="/checkout">
                Go to Checkout
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
