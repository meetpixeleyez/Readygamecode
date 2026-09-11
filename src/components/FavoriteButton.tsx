"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  productId: string;
  initialIsFavorited?: boolean;
  className?: string;
  size?: number;
}

export function FavoriteButton({ productId, initialIsFavorited = false, className, size = 20 }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault(); // Prevent triggering parent links if embedded in a card
    e.stopPropagation();

    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update favorites");
      }

      setIsFavorited(data.isFavorited);
      
      toast({
        title: data.isFavorited ? "Added to Favorites" : "Removed from Favorites",
        description: data.isFavorited 
          ? "This product has been saved to your dashboard." 
          : "This product was removed from your saved list.",
      });

      // Refresh the page data so lists (like the favorites page) update instantly
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={cn(
        "cursor-pointer rounded-full p-2 transition-colors hover:bg-muted/50",
        loading && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        size={size}
        className={cn(
          "transition-all duration-300",
          isFavorited ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground hover:text-red-500/70"
        )}
      />
    </button>
  );
}
