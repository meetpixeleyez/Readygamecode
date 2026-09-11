"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Rocket, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasSeenModal = localStorage.getItem("hasSeenWelcomeModal");
    
    // Only show if they haven't seen it
    if (!hasSeenModal) {
      // Delay showing the modal for a better user experience
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Mark as seen when closed
      localStorage.setItem("hasSeenWelcomeModal", "true");
    }
  };

  const handleAction = () => {
    setIsOpen(false);
    localStorage.setItem("hasSeenWelcomeModal", "true");
  };

  // Prevent hydration mismatch
  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border bg-card/60 backdrop-blur-xl shadow-2xl">
        <div className="relative p-6 sm:p-8 flex flex-col gap-5 bg-gradient-to-br from-indigo-50/50 via-white/80 to-purple-50/50 dark:from-indigo-950/20 dark:via-background/80 dark:to-purple-950/20">
          
          <DialogHeader className="space-y-3 text-left">
            <div>
              <Badge variant="default" className="bg-indigo-500 hover:bg-indigo-600 text-white border-none shadow-md shadow-indigo-500/25">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Join Our Community
              </Badge>
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Ready Game Code</span>
            </DialogTitle>
            <div className="text-muted-foreground text-sm leading-relaxed">
              <p className="text-foreground font-medium mb-1">
                The ultimate marketplace for game developers and creators.
              </p>
              Discover high-quality game source codes, connect with top developers, and accelerate your game development journey.
            </div>
          </DialogHeader>

          <div className="bg-background/60 rounded-xl p-4 border border-border shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-blue-100 dark:bg-blue-900/30 p-1 rounded text-blue-600 dark:text-blue-400">
                <Rocket className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium">Ready-to-publish Game Source Codes</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-emerald-100 dark:bg-emerald-900/30 p-1 rounded text-emerald-600 dark:text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium">AdMob & IAP Integration Ready</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-orange-100 dark:bg-orange-900/30 p-1 rounded text-orange-600 dark:text-orange-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium">Premium Support & Documentation</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button 
              size="lg" 
              className="w-full bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-lg"
              asChild
              onClick={handleAction}
            >
              <Link href="/register">
                Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground hover:text-foreground"
              asChild
              onClick={handleAction}
            >
              <Link href="/login">
                Already have an account? Sign In
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
