"use client";

import { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Folder, MoreVertical } from "lucide-react";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    try {
      const res = await fetch("/api/collections");
      const data = await res.json();
      if (res.ok) {
        setCollections(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCollection(e: FormEvent) {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    
    setCreating(true);

    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCollectionName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create collection");
      }

      toast({ title: "Success", description: "Collection created!" });
      setNewCollectionName("");
      fetchCollections();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
        <p className="text-muted-foreground mt-2">
          Group your saved items into custom collections.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Collection</h2>
        <form onSubmit={handleCreateCollection} className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="name" className="sr-only">Collection Name</Label>
            <Input
              id="name"
              placeholder="e.g. Action Games, Assets to Buy..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={creating || !newCollectionName.trim()}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Create
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-12 border border-border rounded-lg bg-card/50">
          <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">You haven&apos;t created any collections yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div key={collection.id} className="border border-border rounded-lg bg-card p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg line-clamp-1">{collection.name}</h3>
                <Button variant="ghost" size="icon" className="-mt-2 -mr-2 text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground mb-6">
                {collection.products.length} {collection.products.length === 1 ? 'item' : 'items'}
              </div>

              {collection.products.length > 0 ? (
                <div className="flex -space-x-4 mb-4">
                  {collection.products.slice(0, 4).map((item: any, i: number) => (
                    <div key={item.id} className="relative h-12 w-12 rounded-full border-2 border-card overflow-hidden bg-muted z-10" style={{ zIndex: 10 - i }}>
                      <Image
                        src={item.product.image || "/placeholder.png"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                  {collection.products.length > 4 && (
                    <div className="relative h-12 w-12 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs font-medium z-0">
                      +{collection.products.length - 4}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-12 flex items-center text-sm text-muted-foreground italic mb-4">
                  Empty collection
                </div>
              )}

              <Button variant="outline" className="w-full mt-auto">
                View Collection
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
