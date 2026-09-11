"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  category: {
    name: string;
  } | null;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length === 0) {
        setResults([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Failed to fetch search results:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-sm flex-1">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search for games, templates..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length > 0 && setIsOpen(true)}
          className="w-full pl-9 pr-10 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-md shadow-lg overflow-hidden z-50">
          {results.length > 0 ? (
            <ul className="max-h-[400px] overflow-y-auto py-2">
              {results.map((result) => (
                <li key={result.id}>
                  <Link
                    href={`/game-source-code/${result.slug?.replace(/-+$/, "") || result.id}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors"
                  >
                    <div className="relative w-10 h-10 rounded overflow-hidden shrink-0 bg-muted">
                      <Image
                        src={result.thumbnail || "/placeholder.png"}
                        alt={result.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-foreground">
                        {result.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.category?.name || "Uncategorized"}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-primary shrink-0">
                      ${result.price.toFixed(2)}
                    </div>
                  </Link>
                </li>
              ))}
              <li className="border-t border-border mt-2">
                <Link
                  href={`/products?q=${encodeURIComponent(query)}`}
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-xs text-primary py-2 hover:bg-accent hover:underline"
                >
                  View all results for &quot;{query}&quot;
                </Link>
              </li>
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results found for &quot;<span className="text-foreground font-medium">{query}</span>&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
