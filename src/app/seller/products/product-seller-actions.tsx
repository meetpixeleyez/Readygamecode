"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

interface ProductSellerActionsProps {
  productId: string;
  slug: string;
  status: number;
}

export function ProductSellerActions({ productId, slug, status }: ProductSellerActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
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

        throw new Error(data.error || "Failed to delete product");
      }

      toast({
        title: "Product deleted",
        description: "Your product has been deleted successfully.",
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not delete product.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResubmit = async () => {
    setIsDeleting(true); // Using same loading state for simplicity or add a new one
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 0 })
      });

      if (!res.ok) throw new Error("Failed to resubmit");

      toast({
        title: "Resubmitted",
        description: "Your product has been sent for review again.",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not resubmit product.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-1 items-center">
      {status === 2 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="default" className="h-7 text-xs px-2 mr-2">
              Resubmit
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resubmit for Review?</AlertDialogTitle>
              <AlertDialogDescription>
                Make sure you have completed all the required changes requested by the admin. Are you ready to resubmit this product for approval?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResubmit} disabled={isDeleting}>
                {isDeleting ? "Submitting..." : "Yes, Resubmit"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
        <Link href={`/game-source-code/${slug}`} target="_blank">
          <Eye className="h-3.5 w-3.5" />
        </Link>
      </Button>

      {status !== 3 && (
        <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
          <Link href={`/seller/products/${productId}/edit`}>
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </Button>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your product
              from the marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 border-transparent"
            >
              {isDeleting ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
