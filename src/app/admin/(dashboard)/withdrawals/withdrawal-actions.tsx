"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X } from "lucide-react";

export function WithdrawalActions({ withdrawalId, currentStatus }: { withdrawalId: string; currentStatus: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: number, actionName: string) {
    if (!confirm(`Are you sure you want to mark this withdrawal as ${actionName}?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminFeedback: status === 3 ? "Rejected by administrator" : null }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      toast({
        title: "Success",
        description: `Withdrawal has been marked as ${actionName}.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: `Could not process withdrawal.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      {currentStatus === 0 && (
        <>
          <Button 
            size="sm" 
            variant="default" 
            onClick={() => updateStatus(1, "Paid")}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
            Approve
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => updateStatus(3, "Rejected")}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
            Reject
          </Button>
        </>
      )}
    </div>
  );
}
