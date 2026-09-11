import { redirect } from "next/navigation";

export default async function SellerProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/seller/products/${id}/edit`);
}
