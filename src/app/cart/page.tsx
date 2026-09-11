"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  Loader2,
  Shield,
  RefreshCw,
  FileCode,
  Sparkles,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface CartItem {
  id: string;
  productId: string;
  title: string;
  license: string;
  isExtended: number;
  extendedAmount: number;
  price: number;
  buyerFee: number;
  reskinSelected: number;
  publishSelected: number;
  storeOptimizationSelected: number;
  product: {
    slug: string;
    thumbnail: string | null;
    inlinePreviewImage: string | null;
    price: number;
    priceCl: number;
    reskinPrice: number;
    publishPrice: number;
    storeOptimizationPrice: number;
    category: {
      personalBuyerFee: number;
      commercialBuyerFee: number;
      twelveMonthExtendedFee: number;
    } | null;
  };
}

interface CartResponse {
  items: CartItem[];
  count: number;
  totals: {
    subtotal: number;
    buyerFee: number;
    extended: number;
    addon: number;
    discount: number;
    total: number;
  };
}

export default function CartPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  async function updateItem(
    itemId: string,
    action: "toggle_license" | "toggle_extended" | "toggle_service",
    payload: any
  ) {
    setUpdating(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) throw new Error("Update failed");
      await fetchCart();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  }

  async function removeItem(itemId: string) {
    setUpdating(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Remove failed");
      toast({ title: "Item removed from cart" });
      await fetchCart();
    } catch {
      toast({ title: "Remove failed", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  }

  async function clearCart() {
    setUpdating("all");
    try {
      const res = await fetch(`/api/cart`, { method: "DELETE" });
      if (!res.ok) throw new Error("Clear failed");
      toast({ title: "Cart cleared" });
      await fetchCart();
      router.refresh();
    } catch {
      toast({ title: "Clear failed", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const items = data?.items || [];
  const totals = data?.totals;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center py-16 border border-dashed border-border rounded-lg max-w-md mx-auto">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Browse our collection of premium game source codes
          </p>
          <Button asChild>
            <Link href="/products">
              Browse Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Shopping Cart</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} item{items.length === 1 ? "" : "s"} in your cart
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-destructive hover:bg-destructive/10 shrink-0"
          onClick={clearCart}
          disabled={updating !== null}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const addonPrice =
              (item.reskinSelected ? item.product.reskinPrice : 0) +
              (item.publishSelected ? item.product.publishPrice : 0) +
              (item.storeOptimizationSelected ? item.product.storeOptimizationPrice : 0);
            const itemTotal = item.price + item.buyerFee + item.extendedAmount + addonPrice;
            const isUpdating = updating === item.id;

            return (
              <div
                key={item.id}
                className={`border border-border rounded-lg p-4 bg-card transition-opacity ${
                  isUpdating ? "opacity-60" : ""
                }`}
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <Link
                    href={`/game-source-code/${item.product.slug}`}
                    className="shrink-0"
                  >
                    <div className="w-24 h-24 rounded-md overflow-hidden bg-muted relative">
                      <Image
                        src={
                          item.product.thumbnail ||
                          "/products/placeholder.svg"
                        }
                        alt={item.title}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                  </Link>

                  {/* Details + controls */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/game-source-code/${item.product.slug}`}
                        className="font-medium text-sm hover:text-primary line-clamp-2"
                      >
                        {item.title}
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                        disabled={isUpdating}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* License picker */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">License Type</p>
                      <RadioGroup
                        value={item.license}
                        onValueChange={(v) =>
                          updateItem(item.id, "toggle_license", { license: v })
                        }
                        className="flex items-center gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="1" id={`${item.id}-personal`} />
                          <Label
                            htmlFor={`${item.id}-personal`}
                            className="text-xs cursor-pointer"
                          >
                            Personal · ${item.product.price.toFixed(2)}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="2" id={`${item.id}-commercial`} />
                          <Label
                            htmlFor={`${item.id}-commercial`}
                            className="text-xs cursor-pointer"
                          >
                            Commercial · ${item.product.priceCl.toFixed(2)}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Extended license toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={item.isExtended === 1}
                        onCheckedChange={() =>
                          updateItem(item.id, "toggle_extended", {})
                        }
                      />
                      <span className="text-xs">
                        12-month Extended License (+$
                        {item.product.category?.twelveMonthExtendedFee.toFixed(2) || "0.00"})
                      </span>
                    </label>

                    {/* Addon services */}
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Additional Services</p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={item.reskinSelected === 1}
                          onCheckedChange={(v) =>
                            updateItem(item.id, "toggle_service", {
                              service: "reskin",
                              selected: v === true,
                            })
                          }
                        />
                        <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">
                          Reskin (+${item.product.reskinPrice.toFixed(2)})
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={item.publishSelected === 1}
                          onCheckedChange={(v) =>
                            updateItem(item.id, "toggle_service", {
                              service: "publish",
                              selected: v === true,
                            })
                          }
                        />
                        <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">
                          Publish (+${item.product.publishPrice.toFixed(2)})
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={item.storeOptimizationSelected === 1}
                          onCheckedChange={(v) =>
                            updateItem(item.id, "toggle_service", {
                              service: "store_optimization",
                              selected: v === true,
                            })
                          }
                        />
                        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">
                          Store Optimization (+$
                          {item.product.storeOptimizationPrice.toFixed(2)})
                        </span>
                      </label>
                    </div>

                    {/* Active addons badges */}
                    {(item.reskinSelected === 1 ||
                      item.publishSelected === 1 ||
                      item.storeOptimizationSelected === 1 ||
                      item.isExtended === 1) && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.isExtended === 1 && (
                          <Badge variant="secondary" className="text-xs">
                            Extended
                          </Badge>
                        )}
                        {item.reskinSelected === 1 && (
                          <Badge variant="secondary" className="text-xs">
                            Reskin
                          </Badge>
                        )}
                        {item.publishSelected === 1 && (
                          <Badge variant="secondary" className="text-xs">
                            Publish
                          </Badge>
                        )}
                        {item.storeOptimizationSelected === 1 && (
                          <Badge variant="secondary" className="text-xs">
                            Store Opt
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="font-bold text-primary text-lg">
                      ${itemTotal.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      inc. ${item.buyerFee.toFixed(2)} fee
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="border border-border rounded-lg p-4 bg-card sticky top-24 space-y-3">
            <h3 className="font-semibold">Order Summary</h3>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${totals?.subtotal.toFixed(2)}</span>
              </div>
              {totals && totals.buyerFee > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>↳ Buyer Fee</span>
                  <span>${totals.buyerFee.toFixed(2)}</span>
                </div>
              )}
              {totals && totals.extended > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>↳ Extended License</span>
                  <span>${totals.extended.toFixed(2)}</span>
                </div>
              )}
              {totals && totals.addon > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>↳ Addon Services</span>
                  <span>${totals.addon.toFixed(2)}</span>
                </div>
              )}
              {totals && totals.discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Discount</span>
                  <span>-${totals.discount.toFixed(2)}</span>
                </div>
              )}
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary text-lg">${totals?.total.toFixed(2)}</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push("/checkout")}
            >
              Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
              <Shield className="h-3 w-3" />
              Secure checkout via Razorpay / PayPal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
