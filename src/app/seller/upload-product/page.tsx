import { redirect } from "next/navigation";

export default function SellerUploadProductRedirect() {
  redirect("/seller/products/new");
}
