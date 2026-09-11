"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

import { AddedToCartModal, AddedItemDetails } from "@/components/product/added-to-cart-modal";

interface AddToCartOptions {
  productId: string;
  license?: "1" | "2";
  reskinSelected?: boolean;
  publishSelected?: boolean;
  storeOptimizationSelected?: boolean;
  isExtended?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
}

export function useAddToCart() {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [addedItem, setAddedItem] = useState<AddedItemDetails | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  const addToCart = useCallback(
    async (opts: AddToCartOptions) => {
      if (loading) return;
      setLoading(true);
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: opts.productId,
            license: opts.license || "1",
            reskinSelected: opts.reskinSelected || false,
            publishSelected: opts.publishSelected || false,
            storeOptimizationSelected: opts.storeOptimizationSelected || false,
            isExtended: opts.isExtended || false,
          }),
        });

        const data = await res.json();

        if (res.status === 409) {
          // Already in cart
          toast({
            title: "Already in cart",
            description: "This item is already in your cart.",
          });
          setAdded(true);
          return;
        }

        if (!res.ok) {
          toast({
            title: "Failed to add to cart",
            description: data.error || "Try again later.",
            variant: "destructive",
          });
          return;
        }

        setAdded(true);

        // Prepare item details for the popup modal
        if (data.cartItem) {
          const item = data.cartItem;
          const product = item.product || {};
          const authorName = product.user?.username || "Ready Game Code";
          setAddedItem({
            title: item.title || product.title || "Item",
            authorName,
            price: item.price ?? 0,
            thumbnail: product.thumbnail,
          });
          setModalOpen(true);
        } else {
          toast({
            title: "Added to cart!",
            description: "Item added successfully.",
          });
        }

        router.refresh();
        setTimeout(() => setAdded(false), 2000);
      } catch {
        toast({
          title: "Network error",
          description: "Could not reach the server.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast, router]
  );

  return { addToCart, loading, added, modalOpen, setModalOpen, addedItem };
}

export function AddToCartButton({
  productId,
  license = "1",
  reskinSelected = false,
  publishSelected = false,
  storeOptimizationSelected = false,
  isExtended = false,
  variant = "default",
  size = "default",
  className = "",
  label = "Add to Cart",
}: AddToCartOptions) {
  const { addToCart, loading, added, modalOpen, setModalOpen, addedItem } = useAddToCart();

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={loading}
        onClick={() =>
          addToCart({
            productId,
            license,
            reskinSelected,
            publishSelected,
            storeOptimizationSelected,
            isExtended,
          })
        }
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : added ? (
          <Check className="mr-2 h-4 w-4" />
        ) : (
          <ShoppingCart className="mr-2 h-4 w-4" />
        )}
        {added ? "Added!" : label}
      </Button>

      <AddedToCartModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={addedItem}
      />
    </>
  );
}
