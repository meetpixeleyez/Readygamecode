import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CampaignForm } from "@/app/seller/campaigns/new/campaign-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  // Fetch approved products owned by the author to include in campaigns
  const products = await db.product.findMany({
    where: {
      userId: session.sub,
      status: 1
    },
    select: {
      id: true,
      title: true,
      price: true,
      thumbnail: true,
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/seller/campaigns"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Campaign</h1>
          <p className="text-muted-foreground">Run a sale or discount on your products.</p>
        </div>
      </div>

      <CampaignForm availableProducts={products} />
    </div>
  );
}
