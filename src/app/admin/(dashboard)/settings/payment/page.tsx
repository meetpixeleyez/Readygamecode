"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, CreditCard, Shield, Eye, EyeOff } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

export default function AdminPaymentSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [showPaypalSecret, setShowPaypalSecret] = useState(false);

  // Toggle Confirmation Modal State
  const [pendingToggle, setPendingToggle] = useState<{
    gateway: "razorpay" | "paypal";
    targetState: boolean;
  } | null>(null);

  const [form, setForm] = useState({
    razorpayEnabled: true,
    razorpayKeyId: "",
    razorpayKeySecret: "",
    paypalEnabled: true,
    paypalClientId: "",
    paypalClientSecret: "",
    paypalMode: "sandbox",
  });

  useEffect(() => {
    fetch("/api/admin/payment-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setForm({
            razorpayEnabled: data.settings.razorpayEnabled ?? true,
            razorpayKeyId: data.settings.razorpayKeyId || "",
            razorpayKeySecret: data.settings.razorpayKeySecret || "",
            paypalEnabled: data.settings.paypalEnabled ?? true,
            paypalClientId: data.settings.paypalClientId || "",
            paypalClientSecret: data.settings.paypalClientSecret || "",
            paypalMode: data.settings.paypalMode || "sandbox",
          });
        }
      })
      .catch((err) => console.error("Failed to load payment settings", err))
      .finally(() => setLoading(false));
  }, []);

  function handleConfirmToggle() {
    if (!pendingToggle) return;
    const { gateway, targetState } = pendingToggle;

    if (gateway === "razorpay") {
      setForm((prev) => ({ ...prev, razorpayEnabled: targetState }));
      toast({
        title: targetState ? "Razorpay Enabled" : "Razorpay Disabled",
        description: targetState
          ? "Razorpay is now enabled for buyers. Remember to click 'Save Configurations'."
          : "Razorpay is now disabled and will be hidden from buyers. Remember to click 'Save Configurations'.",
      });
    } else if (gateway === "paypal") {
      setForm((prev) => ({ ...prev, paypalEnabled: targetState }));
      toast({
        title: targetState ? "PayPal Enabled" : "PayPal Disabled",
        description: targetState
          ? "PayPal is now enabled for buyers. Remember to click 'Save Configurations'."
          : "PayPal is now disabled and will be hidden from buyers. Remember to click 'Save Configurations'.",
      });
    }

    setPendingToggle(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update payment settings");
      }

      toast({
        title: "Settings Saved",
        description: "Payment gateway credentials have been updated successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save payment settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment Gateway Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your live credentials for Razorpay and PayPal. These credentials will be used dynamically during checkout.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Razorpay Configuration */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  Razorpay Configuration
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Accept payments via UPI, Credit/Debit Cards, NetBanking, & Wallets in INR.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="razorpayEnabled" className="text-xs font-medium cursor-pointer">
                  {form.razorpayEnabled ? "Enabled" : "Disabled"}
                </Label>
                <Switch
                  id="razorpayEnabled"
                  checked={form.razorpayEnabled}
                  onCheckedChange={(targetState) => {
                    setPendingToggle({ gateway: "razorpay", targetState });
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="razorpayKeyId">Razorpay Key ID *</Label>
              <Input
                id="razorpayKeyId"
                placeholder="rzp_live_xxxxxxxxxxxxxx"
                value={form.razorpayKeyId}
                onChange={(e) => setForm({ ...form, razorpayKeyId: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Find this in your Razorpay Dashboard ➔ Settings ➔ API Keys.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="razorpayKeySecret">Razorpay Key Secret *</Label>
              <div className="relative">
                <Input
                  id="razorpayKeySecret"
                  type={showRazorpaySecret ? "text" : "password"}
                  placeholder="Enter your Razorpay Key Secret"
                  value={form.razorpayKeySecret}
                  onChange={(e) => setForm({ ...form, razorpayKeySecret: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showRazorpaySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PayPal Configuration */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-500" />
                  PayPal Configuration
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Accept international credit card and PayPal payments in USD.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="paypalEnabled" className="text-xs font-medium cursor-pointer">
                  {form.paypalEnabled ? "Enabled" : "Disabled"}
                </Label>
                <Switch
                  id="paypalEnabled"
                  checked={form.paypalEnabled}
                  onCheckedChange={(targetState) => {
                    setPendingToggle({ gateway: "paypal", targetState });
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>PayPal Environment Mode</Label>
              <RadioGroup
                value={form.paypalMode}
                onValueChange={(val) => setForm({ ...form, paypalMode: val })}
                className="flex items-center gap-6 pt-1"
              >
                <div className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="sandbox" id="mode-sandbox" />
                  <Label htmlFor="mode-sandbox" className="cursor-pointer font-medium text-sm">Sandbox (Testing)</Label>
                </div>
                <div className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="live" id="mode-live" />
                  <Label htmlFor="mode-live" className="cursor-pointer font-medium text-sm">Live (Production)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paypalClientId">PayPal Client ID *</Label>
              <Input
                id="paypalClientId"
                placeholder="A--------------------------------------------------"
                value={form.paypalClientId}
                onChange={(e) => setForm({ ...form, paypalClientId: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Obtain this from Developer PayPal Portal ➔ Apps & Credentials.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paypalClientSecret">PayPal Client Secret *</Label>
              <div className="relative">
                <Input
                  id="paypalClientSecret"
                  type={showPaypalSecret ? "text" : "password"}
                  placeholder="Enter your PayPal Secret Key"
                  value={form.paypalClientSecret}
                  onChange={(e) => setForm({ ...form, paypalClientSecret: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPaypalSecret(!showPaypalSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPaypalSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" disabled={saving} className="px-6 min-w-[140px]">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Configurations
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <AlertDialog
        open={Boolean(pendingToggle)}
        onOpenChange={(open) => {
          if (!open) setPendingToggle(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Payment Gateway Change
            </AlertDialogTitle>
            <AlertDialogDescription asChild className="space-y-2 pt-2 text-xs text-muted-foreground">
              <div>
                {pendingToggle && (
                  <>
                    <div className="font-semibold text-foreground text-sm">
                      Are you sure you want to {pendingToggle.targetState ? "enable" : "disable"}{" "}
                      <span className="capitalize text-primary">{pendingToggle.gateway}</span>?
                    </div>
                    <div className="text-muted-foreground">
                      {pendingToggle.targetState
                        ? `Enabling ${pendingToggle.gateway} will allow buyers to select this payment method during checkout.`
                        : `Disabling ${pendingToggle.gateway} will hide this option from the checkout page for all buyers.`}
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggle}
              className={pendingToggle?.targetState ? "bg-primary" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
            >
              Confirm {pendingToggle?.targetState ? "Enable" : "Disable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
