"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowRight,
  Shield,
  CreditCard,
  Smartphone,
  Wallet,
  Lock,
  CheckCircle2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CartItem {
  id: string;
  title: string;
  license: string;
  price: number;
  buyerFee: number;
  extendedAmount: number;
  reskinSelected: number;
  publishSelected: number;
  storeOptimizationSelected: number;
  product: {
    slug: string;
    thumbnail: string | null;
    inlinePreviewImage: string | null;
    reskinPrice: number;
    publishPrice: number;
    storeOptimizationPrice: number;
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

type Gateway = "razorpay" | "paypal" | "manual_upi" | "wallet";

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [gateway, setGateway] = useState<Gateway>("razorpay");
  const [user, setUser] = useState<{ email: string; firstname?: string | null; lastname?: string | null; balance: number } | null>(null);
  const [paymentMethods, setPaymentMethods] = useState({
    razorpayEnabled: true,
    paypalEnabled: true,
    paypalClientId: "",
  });
  const [paypalModalOpen, setPaypalModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/cart").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/payment-methods").then((r) => r.json()).catch(() => ({ razorpayEnabled: true, paypalEnabled: true })),
    ])
      .then(([cartData, userData, methodsData]) => {
        setData(cartData);
        setUser(userData.user);
        if (methodsData) {
          setPaymentMethods({
            razorpayEnabled: methodsData.razorpayEnabled ?? true,
            paypalEnabled: methodsData.paypalEnabled ?? true,
            paypalClientId: methodsData.paypalClientId || "",
          });

          // Set active default gateway based on enabled methods
          if (methodsData.razorpayEnabled) {
            setGateway("razorpay");
          } else if (methodsData.paypalEnabled) {
            setGateway("paypal");
          } else {
            setGateway("wallet");
          }
        }

        if (!userData.user) {
          router.push("/login?redirect=/checkout");
        }
        if (cartData.count === 0) {
          router.push("/cart");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleCheckout() {
    setProcessing(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({
          title: "Checkout failed",
          description: json.error,
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }
      
      if (json.provider === "razorpay") {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: json.amount,
          currency: "INR",
          name: "ReadyGameCode",
          description: "Purchase Digital Assets",
          order_id: json.razorpayOrderId,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch("/api/checkout/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  internalOrderId: json.internalOrderId,
                }),
              });
              const verifyJson = await verifyRes.json();
              
              if (!verifyRes.ok) throw new Error(verifyJson.error);
              
              toast({ title: "Payment successful!", description: "Redirecting to confirmation..." });
              window.location.href = verifyJson.redirectUrl;
            } catch (err: any) {
              toast({ title: "Verification failed", description: err.message, variant: "destructive" });
              setProcessing(false);
            }
          },
          prefill: {
            name: user?.firstname ? `${user.firstname} ${user.lastname || ""}`.trim() : "Guest",
            email: user?.email,
          },
          theme: { color: "#0f172a" },
        };
        
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          toast({ title: "Payment failed", description: response.error.description, variant: "destructive" });
          setProcessing(false);
        });
        rzp.open();
      } else if (json.provider === "paypal") {
        const clientId = json.clientId || paymentMethods.paypalClientId || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
        if (!clientId) {
          toast({ title: "PayPal Config Error", description: "PayPal Client ID is missing. Contact site admin.", variant: "destructive" });
          setProcessing(false);
          return;
        }

        const scriptId = "paypal-sdk-script";
        const renderPayPalButtons = () => {
          setProcessing(false);
          const paypal = (window as any).paypal;
          if (!paypal || !paypal.Buttons) {
            toast({ title: "PayPal SDK Error", description: "Could not load PayPal buttons.", variant: "destructive" });
            return;
          }

          setPaypalModalOpen(true);
          setTimeout(() => {
            const container = document.getElementById("paypal-button-container");
            if (container) {
              container.innerHTML = "";
              paypal.Buttons({
                createOrder: () => json.paypalOrderId,
                onApprove: async (data: any) => {
                  try {
                    const verifyRes = await fetch("/api/checkout/paypal-verify", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        paypalOrderId: data.orderID,
                        internalOrderId: json.internalOrderId,
                      }),
                    });
                    const verifyJson = await verifyRes.json();
                    if (!verifyRes.ok) throw new Error(verifyJson.error);
                    
                    toast({ title: "PayPal Payment successful!", description: "Redirecting to confirmation..." });
                    window.location.href = verifyJson.redirectUrl;
                  } catch (err: any) {
                    toast({ title: "PayPal Verification failed", description: err.message, variant: "destructive" });
                  }
                },
                onError: (err: any) => {
                  toast({ title: "PayPal Error", description: err?.message || "Payment cancelled", variant: "destructive" });
                },
              }).render("#paypal-button-container");
            }
          }, 200);
        };

        let script = document.getElementById(scriptId) as HTMLScriptElement;
        if (!script) {
          script = document.createElement("script");
          script.id = scriptId;
          script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
          script.onload = renderPayPalButtons;
          script.onerror = () => {
            toast({ title: "PayPal SDK Error", description: "Failed to connect to PayPal API.", variant: "destructive" });
            setProcessing(false);
          };
          document.body.appendChild(script);
        } else {
          renderPayPalButtons();
        }
      } else {
        toast({ title: "Payment successful!", description: "Redirecting to confirmation..." });
        window.location.href = json.redirectUrl;
      }
    } catch {
      toast({
        title: "Network error",
        description: "Could not process payment. Try again.",
        variant: "destructive",
      });
      setProcessing(false);
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
  const hasWalletBalance = user && user.balance >= (totals?.total || 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Checkout</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review your order and choose a payment method
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: order items + payment methods */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order items */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <h2 className="font-semibold mb-4">Order Items ({items.length})</h2>
            <div className="space-y-3">
              {items.map((item) => {
                const addonPrice =
                  (item.reskinSelected ? item.product.reskinPrice : 0) +
                  (item.publishSelected ? item.product.publishPrice : 0) +
                  (item.storeOptimizationSelected ? item.product.storeOptimizationPrice : 0);
                const itemTotal = item.price + item.buyerFee + item.extendedAmount + addonPrice;

                return (
                  <div key={item.id} className="flex gap-3 items-center">
                    <Link
                      href={`/game-source-code/${item.product.slug}`}
                      className="shrink-0"
                    >
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted relative">
                        <Image
                          src={
                            item.product.thumbnail ||
                            "/products/placeholder.svg"
                          }
                          alt={item.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/game-source-code/${item.product.slug}`}
                        className="text-sm font-medium hover:text-primary line-clamp-1"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {item.license === "1" ? "Personal License" : "Commercial License"}
                        {item.extendedAmount > 0 && " · Extended"}
                      </p>
                    </div>
                    <div className="font-medium text-sm">${itemTotal.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment methods */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Payment Method
            </h2>
            <RadioGroup
              value={gateway}
              onValueChange={(v) => setGateway(v as Gateway)}
              className="space-y-3"
            >
              {paymentMethods.razorpayEnabled && (
                <PaymentOption
                  value="razorpay"
                  icon={CreditCard}
                  title="Razorpay"
                  description="Pay via UPI, cards, net banking, or wallets (INR)"
                  badge="Recommended for India"
                  checked={gateway === "razorpay"}
                />
              )}
              {paymentMethods.paypalEnabled && (
                <PaymentOption
                  value="paypal"
                  icon={CreditCard}
                  title="PayPal"
                  description="Pay with your PayPal account or credit card (USD)"
                  checked={gateway === "paypal"}
                />
              )}
              <PaymentOption
                value="manual_upi"
                icon={Smartphone}
                title="Google Pay / UPI"
                description="Direct manual UPI transfer integration"
                badge="Coming Soon"
                disabled={true}
                checked={gateway === "manual_upi"}
              />
              {user && (
                <PaymentOption
                  value="wallet"
                  icon={Wallet}
                  title="Wallet Balance"
                  description={
                    hasWalletBalance
                      ? `Available balance: $${user.balance.toFixed(2)}`
                      : `Insufficient balance ($${user.balance.toFixed(2)})`
                  }
                  disabled={!hasWalletBalance}
                  checked={gateway === "wallet"}
                />
              )}
            </RadioGroup>

            <div className="mt-4 p-3 rounded-md bg-accent/50 text-xs text-muted-foreground">
              <strong className="text-foreground">Demo mode:</strong> Payment is processed
              instantly without redirecting to a real gateway. In production, this would
              redirect to Razorpay/PayPal for actual payment.
            </div>
          </div>
        </div>

        {/* Right: order summary */}
        <div className="lg:col-span-1">
          <div className="border border-border rounded-lg p-4 bg-card sticky top-24 space-y-3">
            <h3 className="font-semibold">Order Summary</h3>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Items ({items.length})
                </span>
                <span className="font-medium">
                  ${(totals?.subtotal || 0).toFixed(2)}
                </span>
              </div>
              {totals && totals.buyerFee > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Buyer Fee</span>
                  <span>${totals.buyerFee.toFixed(2)}</span>
                </div>
              )}
              {totals && totals.extended > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Extended License</span>
                  <span>${totals.extended.toFixed(2)}</span>
                </div>
              )}
              {totals && totals.addon > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Addon Services</span>
                  <span>${totals.addon.toFixed(2)}</span>
                </div>
              )}
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary text-lg">
                ${(totals?.total || 0).toFixed(2)}
              </span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={processing || !hasWalletBalance && gateway === "wallet"}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay ${(totals?.total || 0).toFixed(2)}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <Link href="/cart">Back to Cart</Link>
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
              <Shield className="h-3 w-3" />
              Secure SSL encrypted payment
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              Instant download after payment
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={paypalModalOpen} onOpenChange={setPaypalModalOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl font-bold">
              Pay with PayPal
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Complete your purchase securely via PayPal or Credit/Debit Card.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 flex flex-col items-center justify-center min-h-[160px] w-full">
            <div id="paypal-button-container" className="w-full max-w-sm" />
          </div>
          <div className="flex justify-end">
            <AlertDialogCancel onClick={() => setPaypalModalOpen(false)}>Cancel</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PaymentOption({
  value,
  icon: Icon,
  title,
  description,
  badge,
  disabled,
  checked,
}: {
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
  checked: boolean;
}) {
  return (
    <Label
      htmlFor={`pay-${value}`}
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
        checked
          ? "border-primary bg-accent/50"
          : "border-border hover:bg-accent/30"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <RadioGroupItem
        value={value}
        id={`pay-${value}`}
        disabled={disabled}
        className="mt-1"
      />
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          {badge && (
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                disabled
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </Label>
  );
}
