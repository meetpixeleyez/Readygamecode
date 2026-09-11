"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  ChevronDown, 
  Gamepad2, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  X, 
  Wrench, 
  Puzzle, 
  Car, 
  Users, 
  Crosshair, 
  FolderOpen,
  ChevronRight,
  Grid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SubCategory = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
  subCategories: SubCategory[];
};

// Helper function to pick subtle colored icon indicator for subcategories
function getSubCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("action") || lower.includes("war") || lower.includes("sniper") || lower.includes("shoot")) {
    return <Crosshair className="h-4 w-4 text-amber-500 shrink-0" />;
  }
  if (lower.includes("card")) {
    return <Layers className="h-4 w-4 text-indigo-500 shrink-0" />;
  }
  if (lower.includes("puzzle") || lower.includes("casual") || lower.includes("match")) {
    return <Puzzle className="h-4 w-4 text-emerald-500 shrink-0" />;
  }
  if (lower.includes("multiplayer")) {
    return <Users className="h-4 w-4 text-blue-500 shrink-0" />;
  }
  if (lower.includes("racing") || lower.includes("car")) {
    return <Car className="h-4 w-4 text-rose-500 shrink-0" />;
  }
  if (lower.includes("service") || lower.includes("support") || lower.includes("technical")) {
    return <Wrench className="h-4 w-4 text-cyan-500 shrink-0" />;
  }
  return <Gamepad2 className="h-4 w-4 text-primary shrink-0" />;
}

export function CategoryMegaMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;

    const query = search.toLowerCase();
    
    return categories.map(category => {
      if (category.name.toLowerCase().includes(query)) {
        return category;
      }
      
      const filteredSubs = category.subCategories.filter(sub => 
        sub.name.toLowerCase().includes(query)
      );

      return {
        ...category,
        subCategories: filteredSubs
      };
    }).filter(category => category.subCategories.length > 0 || category.name.toLowerCase().includes(query));
  }, [categories, search]);

  const totalSubCount = useMemo(() => {
    return categories.reduce((acc, cat) => acc + cat.subCategories.length, 0);
  }, [categories]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-sm font-semibold flex items-center gap-1.5 hover:bg-primary/10 hover:text-primary transition-all"
        >
          <Grid className="h-4 w-4 text-primary" />
          Categories
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 border-border shadow-2xl rounded-2xl">
        {/* Sleek Header */}
        <DialogHeader className="px-6 py-5 bg-background border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Gamepad2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  Browse Games & Categories
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a category or subcategory to filter game source codes
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="hidden sm:flex text-xs px-3 py-1 font-semibold gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {categories.length} Main Categories
            </Badge>
          </div>

          {/* Search Bar Input */}
          <div className="relative mt-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search categories (e.g. Action, Puzzle, Technical Support, Racing)..."
              className="pl-10 pr-9 h-11 bg-muted/40 border-border focus-visible:ring-primary text-sm rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Clean 2-Column Mega Menu Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-background">
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredCategories.map((category) => (
                <div 
                  key={category.id} 
                  className="rounded-xl border border-border/80 bg-card p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Category Title Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
                      <Link 
                        href={`/products?category=${category.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 hover:text-primary transition-colors group"
                      >
                        <FolderOpen className="h-5 w-5 text-primary" />
                        <h3 className="font-bold text-base tracking-tight text-foreground group-hover:text-primary">
                          {category.name}
                        </h3>
                      </Link>
                      <Badge variant="outline" className="text-[11px] font-semibold text-muted-foreground">
                        {category.subCategories.length} items
                      </Badge>
                    </div>

                    {/* Subcategories Vertical List with internal scrollbar for scalable items */}
                    {category.subCategories.length > 0 ? (
                      <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
                        {category.subCategories.map((sub) => (
                          <Link 
                            key={sub.id}
                            href={`/products?category=${category.id}&sub_category=${sub.id}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-foreground/80 hover:text-primary hover:bg-primary/10 transition-all group/item"
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              {getSubCategoryIcon(sub.name)}
                              <span className="truncate">{sub.name}</span>
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover/item:text-primary group-hover/item:translate-x-0.5 transition-all shrink-0" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/60 italic py-2">
                        No sub-categories available
                      </p>
                    )}
                  </div>

                  {/* Category Bottom Link */}
                  <div className="pt-3 mt-4 border-t border-border/50">
                    <Link
                      href={`/products?category=${category.id}`}
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      View All {category.name} ({category.subCategories.length})
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 flex flex-col items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <h4 className="font-semibold text-base mb-1">No categories found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                No matching results for &quot;{search}&quot;. Try searching for Action, Racing, or Support.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSearch("")}
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-muted/40 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Total <strong>{totalSubCount}</strong> sub-categories available
          </span>
          <Button 
            size="sm" 
            variant="default"
            className="h-8 text-xs font-semibold gap-1.5" 
            asChild
            onClick={() => setOpen(false)}
          >
            <Link href="/products">
              View All Products
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
