"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  baseUrl?: string;
}

export function ProductPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  baseUrl = "/products",
}: ProductPaginationProps) {
  const searchParams = useSearchParams();

  if (totalItems === 0 || totalPages <= 1) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  function createPageUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }
    const queryString = params.toString();
    return `${baseUrl}${queryString ? `?${queryString}` : ""}`;
  }

  // Generate page numbers matching exact client reference UI
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 9;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 4);
      let end = Math.min(totalPages, start + maxVisible - 1);

      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-border mt-8">
      {/* Left side text */}
      <div className="text-xs sm:text-sm text-muted-foreground font-normal">
        Showing <span className="font-medium text-foreground">{startItem}</span> to{" "}
        <span className="font-medium text-foreground">{endItem}</span> of{" "}
        <span className="font-medium text-foreground">{totalItems}</span> results
      </div>

      {/* Right side page numbers bar */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {/* Previous Button */}
          {currentPage > 1 ? (
            <Link
              href={createPageUrl(currentPage - 1)}
              className="h-8 w-8 rounded flex items-center justify-center border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors text-xs"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <span className="h-8 w-8 rounded flex items-center justify-center border border-border/50 text-muted-foreground/30 cursor-not-allowed text-xs">
              <ChevronLeft className="h-4 w-4" />
            </span>
          )}

          {/* Page Numbers */}
          {pages.map((page, idx) => {
            if (page === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="h-8 w-8 rounded flex items-center justify-center text-muted-foreground text-xs"
                >
                  ...
                </span>
              );
            }

            const pageNum = Number(page);
            const isCurrent = pageNum === currentPage;

            return isCurrent ? (
              <span
                key={page}
                className="h-8 w-8 rounded flex items-center justify-center font-medium bg-primary text-primary-foreground shadow-xs text-xs"
              >
                {page}
              </span>
            ) : (
              <Link
                key={page}
                href={createPageUrl(pageNum)}
                className="h-8 w-8 rounded flex items-center justify-center font-normal border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary transition-colors text-xs"
              >
                {page}
              </Link>
            );
          })}

          {/* Next Button */}
          {currentPage < totalPages ? (
            <Link
              href={createPageUrl(currentPage + 1)}
              className="h-8 w-8 rounded flex items-center justify-center border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors text-xs"
              aria-label="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="h-8 w-8 rounded flex items-center justify-center border border-border/50 text-muted-foreground/30 cursor-not-allowed text-xs">
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
