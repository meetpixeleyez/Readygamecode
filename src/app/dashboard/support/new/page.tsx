"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewSupportTicketPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketType, setTicketType] = useState<"ADMIN" | "SELLER" | null>(null);
  const [purchasedProducts, setPurchasedProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: "",
    priority: "2",
    message: "",
    productId: "",
    sellerId: "",
  });

  useEffect(() => {
    if (ticketType === "SELLER") {
      setLoadingProducts(true);
      fetch("/api/user-purchases")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPurchasedProducts(data);
          }
        })
        .finally(() => setLoadingProducts(false));
    }
  }, [ticketType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (ticketType === "SELLER" && !formData.productId) {
      return toast({ title: "Please select a product", variant: "destructive" });
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ticketType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: "Ticket created successfully!" });
        router.push(`/dashboard/support/${data.id}`);
      } else {
        throw new Error(data.error || "Failed to create ticket");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleProductSelect = (val: string) => {
    const prod = purchasedProducts.find(p => p.id === val);
    setFormData({ ...formData, productId: val, sellerId: prod?.sellerId || "" });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/dashboard/support">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Open New Ticket</h1>
          <p className="text-muted-foreground mt-1">
            How can we help you today?
          </p>
        </div>
      </div>

      {!ticketType ? (
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card 
            className="cursor-pointer hover:border-primary transition-all hover:shadow-lg group"
            onClick={() => setTicketType("SELLER")}
          >
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Product Support</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  Need help setting up a game source code you purchased? Contact the seller directly.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary transition-all hover:shadow-lg group"
            onClick={() => setTicketType("ADMIN")}
          >
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Billing & Account</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  Issues with your wallet balance or reporting a user.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 md:p-8 border rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-8 pb-6 border-b">
            <div>
              <h2 className="text-xl font-semibold">
                {ticketType === "SELLER" ? "Product Support" : "Billing & Account Support"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {ticketType === "SELLER" 
                  ? "Your message will be sent directly to the product's author." 
                  : "Your message will be sent to the platform administrators."}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setTicketType(null)}>
              Change Category
            </Button>
          </div>

          {ticketType === "SELLER" && (
            <div className="space-y-3">
              <Label className="text-base">Which product do you need help with?</Label>
              {loadingProducts ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading your purchases...
                </div>
              ) : purchasedProducts.length === 0 ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg text-sm">
                  You haven't purchased any products yet. You can only request product support for items you own.
                </div>
              ) : (
                <Select 
                  value={formData.productId} 
                  onValueChange={handleProductSelect}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select a purchased product" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchasedProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-base">Subject</Label>
            <Input 
              className="h-12"
              value={formData.subject} 
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })} 
              required 
              placeholder="e.g. Need help configuring AdMob"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base">Priority</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(val) => setFormData({ ...formData, priority: val })}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Low - General inquiry</SelectItem>
                <SelectItem value="2">Medium - Setup issue</SelectItem>
                <SelectItem value="3">High - Critical bug / App crash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-base">Describe your issue</Label>
            <Textarea 
              value={formData.message} 
              onChange={(e) => setFormData({ ...formData, message: e.target.value })} 
              placeholder="Please provide as much detail as possible..."
              className="min-h-[200px] resize-y"
              required
            />
          </div>

          <div className="pt-6">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full sm:w-auto"
              disabled={isSubmitting || (ticketType === "SELLER" && !formData.productId)}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                "Submit Ticket"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
