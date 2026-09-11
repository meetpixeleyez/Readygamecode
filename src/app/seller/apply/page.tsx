"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Store, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ApplyPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleApply = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seller/apply", {
        method: "POST",
      });
      
      if (res.ok) {
        setSuccess(true);
        toast({
          title: "Application Approved!",
          description: "You are now a registered seller. Welcome aboard!",
        });
        // Redirect to seller dashboard after a short delay
        setTimeout(() => {
          router.push("/seller");
          router.refresh();
        }, 2000);
      } else {
        throw new Error("Failed to apply");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-md text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Welcome, Author!</h1>
        <p className="text-muted-foreground mb-8">
          Your seller account has been activated. Redirecting you to your new dashboard...
        </p>
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Store className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Become an Author</h1>
        <p className="text-lg text-muted-foreground">
          Join our marketplace and start selling your game source codes, assets, and templates to thousands of buyers worldwide.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Seller Terms & Conditions</h2>
        <div className="prose prose-sm dark:prose-invert mb-8 text-muted-foreground h-48 overflow-y-auto p-4 bg-muted/50 rounded-md border border-border">
          <p>By applying to become an author on Ready Game Code, you agree to the following terms:</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>You own the full copyrights to the digital products you upload.</li>
            <li>You will provide timely support to buyers for at least 6 months after purchase.</li>
            <li>You will not upload malicious code, hidden miners, or harmful scripts.</li>
            <li>Ready Game Code reserves the right to review and reject any submission.</li>
            <li>Earnings are subject to a platform fee as outlined in our fee schedule.</li>
            <li>Withdrawals can be requested once you reach the minimum payout threshold.</li>
          </ul>
        </div>

        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleApply} 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing Application...
            </>
          ) : (
            "Agree & Activate Seller Account"
          )}
        </Button>
      </div>
    </div>
  );
}
