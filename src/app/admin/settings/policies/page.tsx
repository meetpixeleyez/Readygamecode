import { db } from "@/lib/db";
import { PoliciesForm } from "./policies-form";

export const metadata = {
  title: "Manage Policies | Admin Dashboard",
  description: "Update privacy policy, terms & conditions, and refund policy.",
};

export default async function PoliciesPage() {
  const policies = await db.policy.findMany();
  
  const initialData = {
    privacy: policies.find(p => p.slug === "privacy-policy")?.content || "",
    terms: policies.find(p => p.slug === "terms-conditions")?.content || "",
    refund: policies.find(p => p.slug === "refund-policy")?.content || "",
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Policies</h2>
      </div>
      <div className="max-w-4xl">
        <PoliciesForm initialData={initialData} />
      </div>
    </div>
  );
}
