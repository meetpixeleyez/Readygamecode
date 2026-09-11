"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function DepositPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>("10");
  const [processing, setProcessing] = useState(false);

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      // 1. Initialize Razorpay deposit
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: depositAmount }),
      });
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || "Failed to initialize deposit");
      }

      // 2. Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: json.amount,
        currency: "INR",
        name: "ReadyGameCode",
        description: "Add Funds to Wallet",
        order_id: json.razorpayOrderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/deposit/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                depositId: json.depositId,
              }),
            });
            const verifyJson = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyJson.error);
            
            toast({ title: "Funds added successfully!" });
            router.refresh();
            setAmount("");
          } catch (err: any) {
            toast({ title: "Verification failed", description: err.message, variant: "destructive" });
          } finally {
            setProcessing(false);
          }
        },
        theme: { color: "#FF7C31" },
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast({ title: "Payment failed", description: response.error.description, variant: "destructive" });
        setProcessing(false);
      });
      rzp.open();

    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto mt-10">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Funds</h1>
        <p className="text-muted-foreground">Deposit money into your wallet balance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Deposit Amount
          </CardTitle>
          <CardDescription>
            Enter the amount in USD (it will be processed in INR equivalent).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (e.g. 10.00)"
              />
            </div>
            <Button type="submit" disabled={processing} className="w-full">
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {processing ? "Processing..." : "Pay with Razorpay"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
