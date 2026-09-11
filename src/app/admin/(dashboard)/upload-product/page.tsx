import { redirect } from "next/navigation";

export default function AdminUploadProductRedirect() {
  redirect("/admin/products/new");
}
