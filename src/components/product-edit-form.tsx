"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Save, Upload, X, Sparkles, Info, CheckCircle2, AlertCircle, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductEditFormProps {
  initialData: {
    id: string;
    categoryId: string;
    subCategoryId: string;
    title: string;
    description: string;
    price: string;
    priceCl: string;
    demoUrl: string;
    demoApk?: string;
    previewVideo: string;
    thumbnail: string;
    file: string;
    inlinePreviewImage: string;
    tags: string;
    metaTitle: string;
    metaDescription: string;
    reskinPrice: string;
    publishPrice: string;
    storeOptimizationPrice: string;
  };
  isAdmin: boolean;
}

export default function ProductEditForm({ initialData, isAdmin }: ProductEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [form, setForm] = useState({
    ...initialData,
    demoUrl: initialData.demoUrl || "",
    demoApk: initialData.demoApk || "",
    fileUrl: initialData.file?.startsWith("http") ? initialData.file : "",
    tags: initialData.tags ? initialData.tags.split(",").map(t => t.trim()).filter(Boolean) : [] as string[],
  });

  const backLink = isAdmin ? "/admin/products" : "/seller/products";
  const apiEndpoint = isAdmin ? `/api/admin/products/${initialData.id}` : `/api/products/${initialData.id}`;

  // File states
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailMeta, setThumbnailMeta] = useState<{ width: number; height: number; status: "optimal" | "warning"; message: string } | null>(null);
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [demoApkFile, setDemoApkFile] = useState<File | null>(null);
  const [screenshotsFiles, setScreenshotsFiles] = useState<File[]>([]);

  const handleThumbnailSelect = (file: File) => {
    setThumbnailFile(file);
    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const { width, height } = img;
      const ratio = width / height;
      const isExact = width === 860 && height === 450;
      const isCloseRatio = Math.abs(ratio - 860 / 450) < 0.1;

      if (isExact) {
        setThumbnailMeta({ width, height, status: "optimal", message: "✓ Exact match (860 × 450 px)" });
      } else if (isCloseRatio) {
        setThumbnailMeta({ width, height, status: "optimal", message: `✓ Matching aspect ratio (${width} × ${height} px)` });
      } else {
        setThumbnailMeta({
          width,
          height,
          status: "warning",
          message: `⚠️ Selected: ${width} × ${height} px. (860 × 450 px is recommended for 100% perfect card fit)`,
        });
        toast({
          title: "Thumbnail Dimensions",
          description: `Image is ${width}x${height}px. For best card and slider display without cropping, 860x450px is recommended.`,
        });
      }
    };
  };
  
  // Existing files
  const [existingThumbnail, setExistingThumbnail] = useState(initialData.thumbnail);
  const [existingMainFile, setExistingMainFile] = useState(initialData.file);
  const [existingDemoApk, setExistingDemoApk] = useState(initialData.demoApk || "");
  const [existingScreenshots, setExistingScreenshots] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(initialData.inlinePreviewImage || "[]");
      if (Array.isArray(parsed)) return parsed;
    } catch {
      if (initialData.inlinePreviewImage && initialData.inlinePreviewImage !== "[]") {
        return [initialData.inlinePreviewImage];
      }
    }
    return [];
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.categories);
      })
      .catch((err) => console.error("Failed to load categories", err));
  }, []);

  const activeCategory = categories.find((c) => c.id === form.categoryId);
  const subCategories = activeCategory?.subCategories || [];
  const activeSubCategory = subCategories.find((sc: any) => sc.id === form.subCategoryId);

  async function uploadFiles() {
    const formData = new FormData();
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
    if (mainFile) formData.append("file", mainFile);
    if (demoApkFile) formData.append("demoApk", demoApkFile);
    
    if (screenshotsFiles.length > 0) {
      for (let i = 0; i < screenshotsFiles.length; i++) {
        formData.append("inlinePreviewImage", screenshotsFiles[i]);
      }
    }

    if (Array.from(formData.keys()).length === 0) return {};

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `File upload failed (${res.status})`);
    }
    
    return data.files;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!form.categoryId || !form.subCategoryId) {
      toast({ title: "Error", description: "Please select a Category and Subcategory.", variant: "destructive" });
      return;
    }

    const finalMainFileCandidate = mainFile ? "" : (existingMainFile || form.fileUrl?.trim() || "");
    if (!mainFile && !finalMainFileCandidate) {
      toast({ title: "Error", description: "Main File (ZIP file or Google Drive / Download link) is required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let finalThumbnail = existingThumbnail;
      let finalMainFile = existingMainFile || form.fileUrl?.trim() || "";
      let finalDemoApk = existingDemoApk || form.demoApk?.trim() || form.demoUrl?.trim() || "";
      let finalScreenshots = [...existingScreenshots];

      if (thumbnailFile || mainFile || demoApkFile || screenshotsFiles.length > 0) {
        toast({ title: "Uploading files...", description: "Please wait while we upload new files." });
        const uploadedFiles = await uploadFiles();
        if (uploadedFiles.thumbnail) {
          finalThumbnail = uploadedFiles.thumbnail;
          setExistingThumbnail(finalThumbnail);
          setThumbnailFile(null);
        }
        if (uploadedFiles.file) {
          finalMainFile = uploadedFiles.file;
          setExistingMainFile(finalMainFile);
          setMainFile(null);
        }
        if (uploadedFiles.demoApk) {
          finalDemoApk = uploadedFiles.demoApk;
          setExistingDemoApk(finalDemoApk);
          setDemoApkFile(null);
        }
        
        if (uploadedFiles.inlinePreviewImage) {
           const newScreenshots = Array.isArray(uploadedFiles.inlinePreviewImage) 
              ? uploadedFiles.inlinePreviewImage 
              : [uploadedFiles.inlinePreviewImage];
           finalScreenshots = [...finalScreenshots, ...newScreenshots];
           setExistingScreenshots(finalScreenshots);
           setScreenshotsFiles([]);
        }
      }

      const res = await fetch(apiEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price) || 0,
          priceCl: parseFloat(form.priceCl) || 0,
          reskinPrice: parseFloat(form.reskinPrice) || 0,
          publishPrice: parseFloat(form.publishPrice) || 0,
          storeOptimizationPrice: parseFloat(form.storeOptimizationPrice) || 0,
          thumbnail: finalThumbnail,
          file: finalMainFile,
          demoApk: finalDemoApk,
          tags: form.tags,
          inlinePreviewImage: JSON.stringify(finalScreenshots),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        let errorDesc = data.error || "Validation failed";
        if (data.details) {
          errorDesc = Object.entries(data.details).map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`).join("\n");
        }
        throw new Error(errorDesc);
      }

      toast({
        title: "Product updated!",
        description: "Your product changes have been saved successfully.",
      });

      router.push(backLink);
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "Could not reach the server.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const removeExistingScreenshot = (idx: number) => {
    setExistingScreenshots(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={backLink}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update the details below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category & Subcategory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <SearchableSelect
                  id="category"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  value={form.categoryId}
                  onValueChange={(val) => setForm({ ...form, categoryId: val, subCategoryId: "" })}
                  placeholder="Select Category"
                  searchPlaceholder="Search category..."
                  emptyText="No categories found."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subCategory">Subcategory *</Label>
                <SearchableSelect
                  id="subCategory"
                  options={subCategories.map((sc: any) => ({ value: sc.id, label: sc.name }))}
                  value={form.subCategoryId}
                  onValueChange={(val) => setForm({ ...form, subCategoryId: val })}
                  disabled={!form.categoryId || subCategories.length === 0}
                  placeholder={!form.categoryId ? "Select Category first" : subCategories.length === 0 ? "No Subcategories" : "Select Subcategory"}
                  searchPlaceholder="Search subcategory..."
                  emptyText="No subcategories found."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Product Title *</Label>
              <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <RichTextEditor 
                value={form.description} 
                onChange={(val) => setForm({ ...form, description: val })}
                productTitle={form.title}
                categoryName={activeCategory?.name}
                subcategoryName={activeSubCategory?.name}
                tags={form.tags}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <TagInput value={form.tags} onChange={(val) => setForm({ ...form, tags: val })} />
            </div>
          </CardContent>
        </Card>

        {/* Files */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Thumbnail Image *</Label>

              <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 hover:bg-muted/30 transition-all p-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Info Badges */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        <Sparkles className="w-3.5 h-3.5" /> 860 × 450 px
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                        Ratio 1.91 : 1
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] text-muted-foreground font-medium">
                        PNG, JPG, WEBP
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-primary/80 shrink-0" />
                      Optimized for flawless game card display without cropping or black bars.
                    </p>
                  </div>

                  {/* Right Upload Trigger */}
                  <div className="shrink-0 flex items-center gap-3">
                    <Label
                      htmlFor="thumbnail"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Upload className="w-4 h-4" />
                      {thumbnailFile || existingThumbnail ? "Change Thumbnail" : "Upload Thumbnail"}
                    </Label>
                    <Input
                      id="thumbnail"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) handleThumbnailSelect(e.target.files[0]);
                      }}
                    />
                  </div>
                </div>

                {/* Live Preview */}
                {thumbnailFile ? (
                  <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative w-56 aspect-[860/450] rounded-xl overflow-hidden border border-border/80 shadow-md group bg-black/40">
                      <img src={URL.createObjectURL(thumbnailFile)} alt="New Thumbnail" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailFile(null);
                          setThumbnailMeta(null);
                        }}
                        className="cursor-pointer absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {thumbnailMeta && (
                      <div className="space-y-1">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                          thumbnailMeta.status === "optimal"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        )}>
                          {thumbnailMeta.status === "optimal" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          {thumbnailMeta.message}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {thumbnailFile.name} · {(thumbnailFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    )}
                  </div>
                ) : existingThumbnail ? (
                  <div className="pt-3 border-t border-border/60 flex items-center gap-4">
                    <div className="relative w-56 aspect-[860/450] rounded-xl overflow-hidden group shadow-md bg-black/40 border border-border">
                      <img src={existingThumbnail} alt="Current Thumbnail" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs text-muted-foreground">Current active thumbnail</span>
                  </div>
                ) : null}
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="mainFileUrl">Main File (ZIP) / Google Drive Link *</Label>
              <Input
                id="mainFileUrl"
                type="url"
                placeholder="https://drive.google.com/file/d/... or Direct Download Link"
                value={form.fileUrl}
                onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
              />
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <Label htmlFor="mainFile" className="flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer rounded-md border text-sm font-medium transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    {mainFile || existingMainFile || form.fileUrl ? "Upload ZIP File Instead" : "Upload ZIP File"}
                  </Label>
                  <Input id="mainFile" type="file" accept=".zip,.rar,.7z" className="hidden" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      if (file.size > 10 * 1024 * 1024) {
                        toast({
                          title: "File size exceeds 10MB",
                          description: `"${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)}MB) is too large. Maximum 10MB is allowed for file uploading. Please use the Google Drive / Download link option above for larger files.`,
                          variant: "destructive",
                        });
                        e.target.value = "";
                        return;
                      }
                      setMainFile(file);
                    }
                  }} />
                  {!mainFile && !existingMainFile && !form.fileUrl && <span className="text-sm text-muted-foreground">ZIP file or Drive link required </span>}
                </div>
                {mainFile ? (
                  <div className="flex items-center justify-between p-3 border rounded-md max-w-sm">
                    <span className="text-sm truncate mr-4">{mainFile.name} ({(mainFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                    <button type="button" onClick={() => setMainFile(null)} className="cursor-pointer text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                  </div>
                ) : existingMainFile ? (
                  <div className="flex items-center justify-between p-3 border rounded-md max-w-sm">
                    <span className="text-sm truncate mr-4 text-blue-600 font-medium">
                      {existingMainFile.split('/').pop()}
                    </span>
                    <button type="button" onClick={() => setExistingMainFile("")} className="cursor-pointer text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">Max 10MB allowed for direct upload. For files above 10MB, please provide a Google Drive / Download link above.</p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="demoApk">Demo APK / Google Drive Link</Label>
              <Input
                id="demoApk"
                type="url"
                placeholder="https://drive.google.com/file/d/... or APK URL"
                value={form.demoApk || form.demoUrl}
                onChange={(e) => setForm({ ...form, demoApk: e.target.value, demoUrl: e.target.value })}
              />
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <Label htmlFor="demoApkFile" className="flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer rounded-md border text-sm font-medium transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    {existingDemoApk || form.demoApk || form.demoUrl ? "Upload APK File Instead" : "Upload APK File"}
                  </Label>
                  <Input id="demoApkFile" type="file" accept=".apk,.zip,.rar" className="hidden" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      if (file.size > 10 * 1024 * 1024) {
                        toast({
                          title: "File size exceeds 10MB",
                          description: `"${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)}MB) is too large. Maximum 10MB is allowed for file uploading. Please use the Google Drive / Download link option above for larger files.`,
                          variant: "destructive",
                        });
                        e.target.value = "";
                        return;
                      }
                      setDemoApkFile(file);
                    }
                  }} />
                  {!demoApkFile && !existingDemoApk && <span className="text-sm text-muted-foreground">Optional (Max 10MB)</span>}
                </div>
                {demoApkFile ? (
                  <div className="flex items-center justify-between p-3 border rounded-md max-w-sm">
                    <span className="text-sm truncate mr-4">{demoApkFile.name} ({(demoApkFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                    <button type="button" onClick={() => setDemoApkFile(null)} className="cursor-pointer text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                  </div>
                ) : existingDemoApk ? (
                  <div className="flex items-center justify-between p-3 border rounded-md max-w-sm">
                    <span className="text-sm truncate mr-4 text-blue-600 font-medium">
                      {existingDemoApk.split('/').pop()}
                    </span>
                    <button type="button" onClick={() => setExistingDemoApk("")} className="cursor-pointer text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">Max 10MB allowed for direct upload. For files above 10MB, please provide a Google Drive / Download link above.</p>
            </div>
            
            <div className="space-y-3">
              <Label>Screenshots</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <Label htmlFor="screenshots" className="flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer rounded-md border text-sm font-medium transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    Add More Files
                  </Label>
                  <Input id="screenshots" type="file" accept="image/png, image/jpeg, image/jpg" multiple className="hidden" onChange={(e) => {
                    if (e.target.files) {
                      setScreenshotsFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }} />
                  <span className="text-sm text-muted-foreground">
                    {screenshotsFiles.length > 0 ? `${screenshotsFiles.length} new file(s) selected` : "No new files"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {existingScreenshots.map((url, idx) => (
                    <div key={`exist-${idx}`} className="relative w-24 h-24 border rounded-md overflow-hidden group">
                      <img src={url} alt="Screenshot" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExistingScreenshot(idx)} className="cursor-pointer absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {screenshotsFiles.map((file, idx) => (
                    <div key={`new-${idx}`} className="relative w-24 h-24 border-2 border-primary border-dashed rounded-md overflow-hidden group">
                      <img src={URL.createObjectURL(file)} alt="New Screenshot" className="w-full h-full object-cover opacity-80" />
                      <button type="button" onClick={() => setScreenshotsFiles(prev => prev.filter((_, i) => i !== idx))} className="cursor-pointer absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="previewVideo">Preview Video (YouTube URL)</Label>
              <Input id="previewVideo" type="url" value={form.previewVideo} onChange={(e) => setForm({ ...form, previewVideo: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Personal License Price ($) *</Label>
                <Input id="price" type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceCl">Commercial License Price ($) *</Label>
                <Input id="priceCl" type="number" step="0.01" required value={form.priceCl} onChange={(e) => setForm({ ...form, priceCl: e.target.value })} />
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-sm font-medium">Additional Service Prices</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div className="space-y-2"><Label>Reskin ($)</Label><Input type="number" step="0.01" value={form.reskinPrice} onChange={(e) => setForm({ ...form, reskinPrice: e.target.value })} /></div>
                <div className="space-y-2"><Label>Publish ($)</Label><Input type="number" step="0.01" value={form.publishPrice} onChange={(e) => setForm({ ...form, publishPrice: e.target.value })} /></div>
                <div className="space-y-2"><Label>Store Opt ($)</Label><Input type="number" step="0.01" value={form.storeOptimizationPrice} onChange={(e) => setForm({ ...form, storeOptimizationPrice: e.target.value })} /></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO & Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              SEO & Metadata Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaTitle">SEO Meta Title</Label>
                <span className="text-[11px] text-muted-foreground">
                  {form.metaTitle?.length || 0} / 60 characters (Optional)
                </span>
              </div>
              <Input
                id="metaTitle"
                placeholder="e.g. Screw Puzzle Unity Source Code — Train Your Mind"
                value={form.metaTitle || ""}
                onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Custom Google search title. Leave empty to automatically use the Product Title.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaDescription">SEO Meta Description *</Label>
                <span className="text-[11px] text-muted-foreground">
                  {form.metaDescription?.length || 0} / 160 characters
                </span>
              </div>
              <Textarea
                id="metaDescription"
                rows={3}
                placeholder="e.g. Take on a satisfying brain-training challenge with Screw Puzzle, an addictive Unity game template with full AdMob and IAP support."
                value={form.metaDescription || ""}
                onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Brief summary that appears in Google search engine snippets and social media previews.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" asChild><Link href={backLink}>Cancel</Link></Button>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
