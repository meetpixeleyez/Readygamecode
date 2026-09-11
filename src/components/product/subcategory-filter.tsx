"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SubCategory {
  id: string;
  name: string;
}

interface SubCategoryFilterProps {
  subCategories: SubCategory[];
  categoryFilter?: string;
  subCategoryFilter?: string;
  search?: string;
  sortBy?: string;
  minPrice?: string;
  maxPrice?: string;
  featured?: string;
}

export function SubCategoryFilter({
  subCategories,
  categoryFilter,
  subCategoryFilter,
  search,
  sortBy,
  minPrice,
  maxPrice,
  featured,
}: SubCategoryFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const getSubCategoryUrl = (subId?: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sortBy && sortBy !== "new_item") params.set("sort_by", sortBy);
    if (categoryFilter) params.set("category", categoryFilter);
    if (subId) params.set("sub_category", subId);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (featured) params.set("featured", featured);
    const query = params.toString();
    return `/products${query ? `?${query}` : ""}`;
  };

  const filteredSubCategories = subCategories.filter((sub) =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-semibold text-sm">Sub-Category</h3>
        {subCategories.length > 0 && (
          <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
            {subCategories.length}
          </span>
        )}
      </div>

      {/* Search Input for Sub-Categories */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search sub-category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8 pl-8 pr-7 text-xs bg-muted/30 focus-visible:bg-transparent"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Scrollable Sub-Category List */}
      <div className="max-h-52 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
        {!searchTerm && (
          <Link
            href={getSubCategoryUrl(undefined)}
            className={`block text-xs px-2.5 py-1.5 rounded-md transition-colors ${
              !subCategoryFilter
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            All Sub-Categories
          </Link>
        )}

        {filteredSubCategories.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No sub-categories found
          </p>
        ) : (
          filteredSubCategories.map((sub) => (
            <Link
              key={sub.id}
              href={getSubCategoryUrl(sub.id)}
              className={`block text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                subCategoryFilter === sub.id
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              {sub.name}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
