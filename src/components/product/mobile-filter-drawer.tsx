"use client";

import { useState } from "react";
import { SlidersHorizontal, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MobileFilterDrawerProps {
  children: React.ReactNode;
  activeCount?: number;
}

export function MobileFilterDrawer({ children, activeCount = 0 }: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden mb-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2 py-2.5 font-semibold shadow-xs">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span>Filter & Search Products</span>
            {activeCount > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[320px] sm:w-[380px] overflow-y-auto p-6">
          <SheetHeader className="mb-4 text-left border-b pb-3">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold">
              <Filter className="h-5 w-5 text-primary" />
              Filter Products
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-6 pt-2" onClick={() => setOpen(false)}>
            {children}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
