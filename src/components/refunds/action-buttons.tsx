"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X } from "lucide-react";

export function RefundActionButtons({ refundId }: { refundId: string }) {
  const [processing, setProcessing] = useState<"approve" | "decline" | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function handleAction(action: "approve" | "decline") {
    if (processing !== null) return;
    if (!confirm(`Are you sure you want to ${action} this refund? This action cannot be undone.`)) return;

    setProcessing(action);
    try {
      const res = await fetch(`/api/seller/refunds/${refundId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: `Refund ${action}d successfully` });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Failed to process", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={() => handleAction("decline")}
        disabled={processing !== null}
      >
        {processing === "decline" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
        Decline
      </Button>
      <Button 
        variant="default" 
        size="sm" 
        className="bg-green-600 hover:bg-green-700 text-white"
        onClick={() => handleAction("approve")}
        disabled={processing !== null}
      >
        {processing === "approve" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
        Approve Refund
      </Button>
    </div>
  );
}
