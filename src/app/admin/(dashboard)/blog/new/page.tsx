"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function AdminNewBlogPost() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    coverImage: "",
    body: "",
    isPublished: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: "Blog post created!" });
        router.push("/admin/blog");
      } else {
        throw new Error(data.error || "Failed to create");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Blog Post</h1>
        <p className="text-muted-foreground mt-2">Write a new article for your marketplace.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 border rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
              required 
              placeholder="Post Title"
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input 
              value={formData.slug} 
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
              required 
              placeholder="post-url-slug"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cover Image URL</Label>
          <Input 
            value={formData.coverImage} 
            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })} 
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label>Excerpt</Label>
          <Textarea 
            value={formData.excerpt} 
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} 
            placeholder="Short summary for the blog list page..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Body (HTML / Markdown)</Label>
          <Textarea 
            value={formData.body} 
            onChange={(e) => setFormData({ ...formData, body: e.target.value })} 
            placeholder="Write your content here..."
            className="min-h-[300px] font-mono text-sm"
            required
          />
          <p className="text-xs text-muted-foreground">You can use basic HTML tags for formatting.</p>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="isPublished"
            checked={formData.isPublished}
            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isPublished">Publish immediately</Label>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/blog")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Post"}
          </Button>
        </div>
      </form>
    </div>
  );
}
