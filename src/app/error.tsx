"use client";
 
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4 bg-card border border-border p-8 rounded-xl shadow-lg">
        <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Something went wrong</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {error?.message && !error.message.includes("digest")
            ? error.message
            : "An unexpected error occurred while loading this page. Please try reloading."}
        </p>
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => reset()} variant="default" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload Page
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
