"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function RequestRefundPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get("item");
  const { toast } = useToast();

  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!itemId) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Invalid Request</h2>
        <p className="text-muted-foreground mt-2">No item specified for refund.</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.length < 10) {
      toast({ title: "Reason too short", description: "Please provide a detailed reason.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderItemId: itemId, reason }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to submit refund request");

      toast({ title: "Refund Requested Successfully" });
      router.push(`/dashboard/refunds/${data.refundRequestId}`);
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto mt-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Request Refund</h1>
        <p className="text-muted-foreground">Submit a refund request for your recent purchase.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Refund Reason</CardTitle>
          <CardDescription>
            Please explain in detail why you are requesting a refund for this item. This message will be sent to the seller for review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="E.g. The source code does not compile on Android Studio, missing files..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={6}
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
