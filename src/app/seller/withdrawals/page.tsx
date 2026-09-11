"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, ArrowRight, Wallet } from "lucide-react";

interface Withdrawal {
  id: string;
  amount: number;
  charge: number;
  finalAmount: number;
  status: number;
  trx: string | null;
  createdAt: string;
  withdrawInformation: string | null;
}

const statusMap: Record<number, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  0: { label: "Pending", variant: "secondary" },
  1: { label: "Approved", variant: "default" },
  2: { label: "Processing", variant: "secondary" },
  3: { label: "Rejected", variant: "destructive" },
};

export default function WithdrawalsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [form, setForm] = useState({
    amount: "",
    method: "google_pay",
    accountInfo: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/withdrawals").then((r) => r.json()),
    ])
      .then(([userData, withdrawalData]) => {
        if (userData.user) setBalance(userData.user.balance);
        if (withdrawalData.withdrawals) setWithdrawals(withdrawalData.withdrawals);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          method: form.method,
          accountInfo: form.accountInfo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Withdrawal failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Withdrawal requested!",
        description: "Your request is pending admin approval.",
      });
      setForm({ amount: "", method: "google_pay", accountInfo: "" });
      // Refresh data
      const [userData, withdrawalData] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch("/api/withdrawals").then((r) => r.json()),
      ]);
      if (userData.user) setBalance(userData.user.balance);
      if (withdrawalData.withdrawals) setWithdrawals(withdrawalData.withdrawals);
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Withdrawals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Request withdrawals and view your withdrawal history
        </p>
      </div>

      {/* Balance card */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/20">
        <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-3xl font-bold text-primary mt-1">
              ${balance.toFixed(2)}
            </p>
          </div>
          <Wallet className="h-10 w-10 text-primary/30" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdrawal form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request Withdrawal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="5"
                  max={balance}
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="50.00"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum: $5.00 · Maximum: ${balance.toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Withdrawal Method</Label>
                <Select
                  value={form.method}
                  onValueChange={(val) => setForm({ ...form, method: val })}
                >
                  <SelectTrigger id="method" className="w-full">
                    <SelectValue placeholder="Select Withdrawal Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google_pay">Google Pay / UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountInfo">Account Information</Label>
                <Textarea
                  id="accountInfo"
                  required
                  rows={3}
                  value={form.accountInfo}
                  onChange={(e) => setForm({ ...form, accountInfo: e.target.value })}
                  placeholder={
                    form.method === "google_pay"
                      ? "Enter your UPI ID (e.g., yourname@upi)"
                      : form.method === "bank_transfer"
                      ? "Enter bank account number, IFSC code, and account holder name"
                      : "Enter your PayPal email address"
                  }
                />
              </div>

              <div className="p-3 rounded-md bg-accent/50 text-xs text-muted-foreground">
                <strong className="text-foreground">Note:</strong> Withdrawals are
                processed within 3-5 business days. A 1% processing fee may apply.
                KYC verification may be required for large withdrawals.
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || balance < 5}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Request Withdrawal
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdrawal history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No withdrawal requests yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {withdrawals.map((w) => {
                  const status = statusMap[w.status] || { label: "Unknown", variant: "outline" as const };
                  return (
                    <div
                      key={w.id}
                      className="border border-border rounded-md p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm">
                          ${w.amount.toFixed(2)}
                        </div>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(w.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {w.trx && (
                          <>
                            {" · "}Trx: <code className="font-mono">{w.trx.slice(-8)}</code>
                          </>
                        )}
                      </div>
                      {w.status === 3 && (
                        <div className="text-xs text-destructive mt-1">
                          Rejected — contact support for details
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
