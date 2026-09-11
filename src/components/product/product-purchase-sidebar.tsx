"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useAddToCart } from "./add-to-cart";
import { AddedToCartModal } from "./added-to-cart-modal";
import {
  ShoppingCart,
  RefreshCw,
  FileCode,
  Shield,
  CheckCircle2,
  Eye,
  Download,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface ProductPurchaseProps {
  isAdmin?: boolean;
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    priceCl: number;
    reskinPrice: number;
    publishPrice: number;
    storeOptimizationPrice: number;
    demoUrl: string | null;
    demoApk?: string | null;
    category: {
      personalBuyerFee: number;
      commercialBuyerFee: number;
      twelveMonthExtendedFee: number;
    } | null;
    hasPurchased?: boolean;
    fileUrl?: string | null;
  };
}

export function ProductPurchaseSidebar({ product, isAdmin = false }: ProductPurchaseProps) {
  const [license, setLicense] = useState<"1" | "2">("1");
  const [isExtended, setIsExtended] = useState(false);
  const [reskin, setReskin] = useState(false);
  const [publish, setPublish] = useState(false);
  const [storeOpt, setStoreOpt] = useState(false);
  const { addToCart, loading, added, modalOpen, setModalOpen, addedItem } = useAddToCart();
  const { toast } = useToast();

  const handleDownloadClick = (e: React.MouseEvent) => {
    if (!product.hasPurchased) {
      e.preventDefault();
      toast({
        title: "Access Denied",
        description: "Download access is disabled or revoked for refunded items. Please purchase to gain access.",
        variant: "destructive",
      });
    }
  };

  const basePrice = license === "1" ? product.price : product.priceCl;
  const extendedAmount = isExtended ? product.category?.twelveMonthExtendedFee || 0 : 0;
  const addonTotal =
    (reskin ? product.reskinPrice : 0) +
    (publish ? product.publishPrice : 0) +
    (storeOpt ? product.storeOptimizationPrice : 0);
  const total = basePrice + extendedAmount + addonTotal;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="space-y-4">
        {/* License picker */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">License Type</Label>
          <RadioGroup
            value={license}
            onValueChange={(v) => setLicense(v as "1" | "2")}
            className="space-y-2"
          >
            <label
              htmlFor="personal-license"
              className={`flex items-center justify-between p-2.5 rounded-md border cursor-pointer transition-colors ${
                license === "1"
                  ? "border-primary bg-accent/50"
                  : "border-border hover:bg-accent/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="1" id="personal-license" />
                <span className="text-sm font-medium">Personal License</span>
              </div>
              <span className="text-sm font-bold text-primary">
                ${product.price.toFixed(2)}
              </span>
            </label>
            <label
              htmlFor="commercial-license"
              className={`flex items-center justify-between p-2.5 rounded-md border cursor-pointer transition-colors ${
                license === "2"
                  ? "border-primary bg-accent/50"
                  : "border-border hover:bg-accent/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="2" id="commercial-license" />
                <span className="text-sm font-medium">Commercial License</span>
              </div>
              <span className="text-sm font-bold text-primary">
                ${product.priceCl.toFixed(2)}
              </span>
            </label>
          </RadioGroup>
        </div>

        {/* Extended license */}
        <label
          className={`flex items-center justify-between p-2.5 rounded-md border cursor-pointer transition-colors ${
            isExtended
              ? "border-primary bg-accent/50"
              : "border-border hover:bg-accent/30"
          }`}
        >
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isExtended}
              onCheckedChange={(v) => setIsExtended(v === true)}
            />
            <span className="text-sm">12-month Extended License</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            +${product.category?.twelveMonthExtendedFee.toFixed(2) || "0.00"}
          </span>
        </label>

        <Separator />

        {/* Addon services */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Additional Services</Label>
          <div className="space-y-2">
            <label
              className={`flex items-center justify-between p-2.5 rounded-md border cursor-pointer transition-colors ${
                reskin
                  ? "border-primary bg-accent/50"
                  : "border-border hover:bg-accent/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <Checkbox checked={reskin} onCheckedChange={(v) => setReskin(v === true)} />
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">Reskin</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                +${product.reskinPrice.toFixed(2)}
              </span>
            </label>
            <label
              className={`flex items-center justify-between p-2.5 rounded-md border cursor-pointer transition-colors ${
                publish
                  ? "border-primary bg-accent/50"
                  : "border-border hover:bg-accent/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <Checkbox checked={publish} onCheckedChange={(v) => setPublish(v === true)} />
                <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">Publish</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                +${product.publishPrice.toFixed(2)}
              </span>
            </label>
            <label
              className={`flex items-center justify-between p-2.5 rounded-md border cursor-pointer transition-colors ${
                storeOpt
                  ? "border-primary bg-accent/50"
                  : "border-border hover:bg-accent/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <Checkbox checked={storeOpt} onCheckedChange={(v) => setStoreOpt(v === true)} />
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">Store Optimization</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                +${product.storeOptimizationPrice.toFixed(2)}
              </span>
            </label>
          </div>
        </div>

        <Separator />

        {/* Total + Add to Cart */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
        </div>

        {isAdmin ? (
          <Button
            className="w-full bg-muted text-muted-foreground hover:bg-muted"
            size="lg"
            disabled
          >
            Admins cannot purchase
          </Button>
        ) : (
          <>
            <Button
              className="w-full"
              size="lg"
              disabled={loading}
              onClick={() =>
                addToCart({
                  productId: product.id,
                  license,
                  isExtended,
                  reskinSelected: reskin,
                  publishSelected: publish,
                  storeOptimizationSelected: storeOpt,
                })
              }
            >
              {loading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Adding...
                </>
              ) : added ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Added! View Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </>
              )}
            </Button>

            <AddedToCartModal
              open={modalOpen}
              onOpenChange={setModalOpen}
              item={addedItem}
            />
          </>
        )}

        {/* Demo APK Download Button for Prospective Buyers */}
        {product.demoApk || product.demoUrl ? (
          <Button 
            variant="outline" 
            className="w-full border-primary/30 text-primary hover:bg-primary/5 font-semibold" 
            size="lg" 
            asChild
          >
            <a
              href={product.demoApk || product.demoUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Demo APK (Free)
            </a>
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="w-full text-muted-foreground cursor-not-allowed opacity-70" 
            size="lg" 
            onClick={() => {
              toast({
                title: "Notice",
                description: "No Demo APK or Google Drive link is available for this product.",
              });
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Demo APK (Free)
          </Button>
        )}

        <Separator />

        {/* Trust badges */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Future Updates Included
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            3 Months Support
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Secure Payment via Razorpay / PayPal
          </div>
        </div>
      </div>

      {/* Sticky Floating Mobile Action Bar (Always visible on Android / Mobile screens) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/95 backdrop-blur-xl border-t border-border/80 shadow-[0_-4px_24px_rgba(0,0,0,0.25)] p-3 px-4 flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
            {license === "1" ? "Personal License" : "Commercial License"}
          </span>
          <span className="text-xl sm:text-2xl font-black text-primary leading-tight">
            ${total.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {product.demoApk || product.demoUrl ? (
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-3 border-border/80 text-muted-foreground hover:text-foreground text-xs"
              asChild
            >
              <a
                href={product.demoApk || product.demoUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Demo APK</span>
              </a>
            </Button>
          ) : null}

          {isAdmin ? (
            <Button size="sm" className="h-10 px-4 bg-muted text-muted-foreground" disabled>
              Admin View
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-10 px-5 font-bold shadow-lg flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading}
              onClick={() =>
                addToCart({
                  productId: product.id,
                  license,
                  isExtended,
                  reskinSelected: reskin,
                  publishSelected: publish,
                  storeOptimizationSelected: storeOpt,
                })
              }
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Adding...</span>
                </>
              ) : added ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
