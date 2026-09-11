import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import ProductEditForm from "@/components/product-edit-form";

export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "admin" && session.role !== "ADMIN")) redirect("/admin/login");

  const { id } = await params;

  const product = await db.product.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
  });

  if (!product) {
    notFound();
  }

  // Parse tags if possible
  let tags = "";
  if (product.tags) {
    try {
      const parsed = JSON.parse(product.tags);
      if (Array.isArray(parsed)) tags = parsed.join(", ");
      else tags = String(parsed);
    } catch {
      tags = product.tags;
    }
  }

  const initialData = {
    id: product.id,
    categoryId: product.categoryId || "",
    subCategoryId: product.subCategoryId || "",
    title: product.title || "",
    description: product.description || "",
    price: (product.price ?? 0).toString(),
    priceCl: (product.priceCl ?? 0).toString(),
    demoUrl: product.demoUrl || "",
    demoApk: product.demoApk || "",
    previewVideo: product.previewVideo || "",
    thumbnail: product.thumbnail || "",
    file: product.file || "",
    inlinePreviewImage: product.inlinePreviewImage || "[]",
    tags,
    metaTitle: product.metaTitle || "",
    metaDescription: product.metaDescription || "",
    reskinPrice: (product.reskinPrice ?? 0).toString(),
    publishPrice: (product.publishPrice ?? 0).toString(),
    storeOptimizationPrice: (product.storeOptimizationPrice ?? 0).toString(),
  };

  return <ProductEditForm initialData={initialData} isAdmin={true} />;
}
