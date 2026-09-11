"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface PriceFilterProps {
  initialMin?: number;
  initialMax?: number;
  maxLimit?: number;
}

export function PriceFilter({ initialMin, initialMax, maxLimit = 100 }: PriceFilterProps) {
  const [range, setRange] = useState([initialMin || 0, initialMax || maxLimit]);

  useEffect(() => {
    setRange([initialMin || 0, initialMax || maxLimit]);
  }, [initialMin, initialMax, maxLimit]);

  return (
    <div className="space-y-4 pt-2">
      <Slider
        defaultValue={[initialMin || 0, initialMax || maxLimit]}
        value={range}
        min={0}
        max={maxLimit}
        step={1}
        onValueChange={setRange}
        className="w-full"
      />
      
      <div className="flex items-center justify-between text-sm">
        <div className="font-medium">
          <Label className="text-xs text-muted-foreground block mb-1">Min Price</Label>
          ${range[0]}
        </div>
        <div className="font-medium text-right">
          <Label className="text-xs text-muted-foreground block mb-1">Max Price</Label>
          ${range[1]}
        </div>
      </div>

      {/* Hidden inputs to pass data to the parent form submission */}
      <input type="hidden" name="min_price" value={range[0]} />
      <input type="hidden" name="max_price" value={range[1]} />
    </div>
  );
}
