"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface DateFilterProps {
  counts: {
    any: number;
    year: number;
    month: number;
    week: number;
    day: number;
  };
}

export function DateFilter({ counts }: DateFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentValue = searchParams.get("date_range") || "all";

  const handleSelect = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === "all") {
      params.delete("date_range");
    } else {
      params.set("date_range", val);
    }
    router.push(`/products?${params.toString()}`);
  };

  const options = [
    { label: "Any Date", value: "all", count: counts.any },
    { label: "Past Year", value: "365", count: counts.year },
    { label: "Past Month", value: "30", count: counts.month },
    { label: "Past Week", value: "7", count: counts.week },
    { label: "Past 24h", value: "1", count: counts.day },
  ];

  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => {
        const isActive = currentValue === option.value;
        return (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`cursor-pointer
              relative flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200
              ${isActive 
                ? "bg-primary/10 border-primary text-primary font-medium" 
                : "bg-card border-transparent hover:border-border hover:bg-accent text-muted-foreground"
              }
            `}
          >
            <div className="flex items-center gap-2">
              {/* Custom Radio Dot */}
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                ${isActive ? "border-primary" : "border-muted-foreground/30"}
              `}>
                {isActive && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span>{option.label}</span>
            </div>
            
            <Badge 
              variant="secondary" 
              className={`ml-2 text-xs font-normal ${isActive ? "bg-primary/20 text-primary" : ""}`}
            >
              {option.count}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
