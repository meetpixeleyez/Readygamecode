"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LogoutButton({
  variant = "ghost",
  className = "",
  label = "Sign Out",
}: {
  variant?: "default" | "ghost" | "outline" | "secondary" | "destructive";
  className?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleLogout() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed");
      toast({ title: "Signed out", description: "You have been logged out." });
      router.push("/login");
      router.refresh();
    } catch {
      toast({ title: "Logout failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      className={`${variant === "ghost" ? "text-destructive hover:text-destructive" : ""} ${className}`}
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
