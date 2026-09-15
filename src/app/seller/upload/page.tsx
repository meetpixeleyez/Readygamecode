import { redirect } from "next/navigation";

export default function SellerUploadRedirect() {
  redirect("/seller/products/new");
}
