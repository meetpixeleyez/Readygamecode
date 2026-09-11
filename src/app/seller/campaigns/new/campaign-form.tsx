"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Image from "next/image";

type Product = { id: string; title: string; price: number; thumbnail: string | null };

export function CampaignForm({ availableProducts }: { availableProducts: Product[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    discountMin: 10,
    discountMax: 50,
    startDate: "",
    endDate: "",
  });

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [discounts, setDiscounts] = useState<Record<string, number>>({});

  const toggleProduct = (pid: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(pid)) {
        const next = prev.filter(p => p !== pid);
        const newDiscounts = { ...discounts };
        delete newDiscounts[pid];
        setDiscounts(newDiscounts);
        return next;
      } else {
        setDiscounts({ ...discounts, [pid]: formData.discountMin });
        return [...prev, pid];
      }
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      return toast({ title: "Select at least 1 product", variant: "destructive" });
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/seller/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          productIds: selectedProducts,
          discounts
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "Campaign created successfully!" });
      router.push("/seller/campaigns");
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Campaign Name</Label>
          <Input 
            required 
            placeholder="e.g. Black Friday Sale"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input 
            type="datetime-local" 
            required
            value={formData.startDate}
            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input 
            type="datetime-local" 
            required
            value={formData.endDate}
            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Minimum Discount (%)</Label>
          <Input 
            type="number" 
            min="1" max="99" 
            required
            value={formData.discountMin}
            onChange={e => setFormData({ ...formData, discountMin: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label>Maximum Discount (%)</Label>
          <Input 
            type="number" 
            min="1" max="99" 
            required
            value={formData.discountMax}
            onChange={e => setFormData({ ...formData, discountMax: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Select Products</h3>
        {availableProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">You don't have any approved products to put on sale.</p>
        ) : (
          <div className="grid gap-4">
            {availableProducts.map(product => {
              const isSelected = selectedProducts.includes(product.id);
              return (
                <Card key={product.id} className={`overflow-hidden transition-colors ${isSelected ? 'border-primary bg-primary/5' : ''}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => toggleProduct(product.id)}
                    />
                    
                    {product.thumbnail ? (
                      <Image src={product.thumbnail} alt={product.title} width={60} height={40} className="rounded object-cover" />
                    ) : (
                      <div className="w-[60px] h-[40px] bg-muted rounded" />
                    )}
                    
                    <div className="flex-1">
                      <p className="font-medium">{product.title}</p>
                      <p className="text-sm text-muted-foreground">${product.price}</p>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <Label className="whitespace-nowrap">Discount %</Label>
                        <Input 
                          type="number" 
                          className="w-20"
                          min={formData.discountMin}
                          max={formData.discountMax}
                          value={discounts[product.id] || formData.discountMin}
                          onChange={(e) => setDiscounts({ ...discounts, [product.id]: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Create Campaign
      </Button>
    </form>
  );
}
