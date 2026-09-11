"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function ProductActions({ productId, currentStatus, isFeatured = 0 }: { productId: string; currentStatus: number; isFeatured?: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | "delete" | "take_down" | "republish" | null>(null);

  // Reject modal state
  const [rejectType, setRejectType] = useState<"2" | "3">("2"); // 2 = Soft, 3 = Hard
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  async function updateStatus(status: number, actionName: string, reason?: string) {
    let actionType: "approve" | "reject" | "take_down" | "republish" = "approve";
    if (status === 2 || status === 3) actionType = "reject";
    if (status === 4) actionType = "take_down";
    if (status === 1 && currentStatus === 4) actionType = "republish";
    
    setActionLoading(actionType);
    try {
      const payload: any = {};
      if (status !== -1) payload.status = status;
      if (reason) payload.reason = reason;

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      toast({
        title: "Success",
        description: `Product has been ${actionName.toLowerCase()}.`,
      });
      setIsRejectModalOpen(false);
      setRejectReason("");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: `Could not ${actionName.toLowerCase()} product.`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleFeature() {
    setActionLoading("approve"); // reuse loading state
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: isFeatured === 1 ? 0 : 1 }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast({
        title: "Success",
        description: `Product has been ${isFeatured === 1 ? "removed from" : "added to"} featured products.`,
      });
      router.refresh();
    } catch (error) {
      toast({ title: "Error", description: "Could not update feature status", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    setActionLoading("delete");
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        
        if (res.status === 400) {
          toast({
            title: "Notice",
            description: data.error || "Cannot perform this action.",
          });
          return;
        }

        throw new Error(data.error || "Failed to delete");
      }

      toast({
        title: "Success",
        description: "Product has been deleted permanently.",
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not delete product.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  }

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }
    const statusVal = parseInt(rejectType);
    const actionName = statusVal === 2 ? "Soft Rejected" : "Hard Rejected";
    updateStatus(statusVal, actionName, rejectReason);
  };

  return (
    <div className="flex gap-2 items-center justify-center">
      {currentStatus !== 3 && (
        <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
          <Link href={`/admin/products/${productId}/edit`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      )}

      {currentStatus === 0 && (
        <>
          <Button 
            size="sm" 
            variant="default" 
            onClick={() => updateStatus(1, "Approved")}
            disabled={actionLoading !== null}
          >
            {actionLoading === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
            Approve
          </Button>

          <AlertDialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" disabled={actionLoading !== null}>
                {actionLoading === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject Product</AlertDialogTitle>
                <AlertDialogDescription>
                  Select the type of rejection and provide feedback to the author.
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="py-4 space-y-4">
                <RadioGroup value={rejectType} onValueChange={(val) => setRejectType(val as "2" | "3")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="soft-reject" />
                    <Label htmlFor="soft-reject">Soft Reject (Author can fix and resubmit)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="hard-reject" />
                    <Label htmlFor="hard-reject">Hard Reject (Permanent rejection)</Label>
                  </div>
                </RadioGroup>

                <div className="space-y-2">
                  <Label htmlFor="reason">Rejection Reason</Label>
                  <Textarea 
                    id="reason" 
                    placeholder="Explain why this product is being rejected..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setRejectReason("");
                  setRejectType("2");
                }}>Cancel</AlertDialogCancel>
                <Button variant="destructive" onClick={handleRejectSubmit} disabled={actionLoading !== null || !rejectReason.trim()}>
                  {actionLoading === "reject" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirm Rejection
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      {currentStatus === 1 && (
        <>
          <Button 
            size="sm" 
            variant={isFeatured === 1 ? "secondary" : "outline"} 
            onClick={toggleFeature}
            disabled={actionLoading !== null}
          >
            {isFeatured === 1 ? "Unfeature" : "Feature"}
          </Button>
          <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={actionLoading !== null}>
              {actionLoading === "take_down" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Take Down"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Take Down Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to take down this live product? It will no longer be visible or purchasable by users.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => updateStatus(4, "Taken Down")}>
                Yes, Take Down
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </>
      )}
      
      {currentStatus === 4 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="default" disabled={actionLoading !== null}>
              {actionLoading === "republish" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Republish"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Republish Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to make this product live again? It will be visible and purchasable by users.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => updateStatus(1, "Republished")}>
                Yes, Republish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={actionLoading !== null}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this product from the platform. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 border-transparent">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
