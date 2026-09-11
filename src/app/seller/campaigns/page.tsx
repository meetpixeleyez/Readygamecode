import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SellerCampaignsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const campaigns = await db.campaign.findMany({
    where: {
      campaignProducts: {
        some: { userId: session.sub }
      }
    },
    include: {
      campaignProducts: {
        where: { userId: session.sub },
        include: { product: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns & Sales</h1>
          <p className="text-muted-foreground">Manage your limited-time discounts and promotional events.</p>
        </div>
        <Button asChild>
          <Link href="/seller/campaigns/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Plus className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No campaigns yet</h3>
          <p className="text-muted-foreground mb-4">You haven't run any sales or campaigns yet.</p>
          <Button asChild variant="outline">
            <Link href="/seller/campaigns/new">Start a Sale</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {campaigns.map((camp) => {
            const isActive = camp.status === 1 && new Date() >= camp.startDate && new Date() <= camp.endDate;
            const isUpcoming = camp.status === 1 && new Date() < camp.startDate;
            
            let statusBadge = <Badge variant="secondary">Expired</Badge>;
            if (isActive) statusBadge = <Badge className="bg-green-600 hover:bg-green-700">Active Sale</Badge>;
            else if (isUpcoming) statusBadge = <Badge variant="outline" className="text-blue-600">Upcoming</Badge>;
            else if (camp.status === 0) statusBadge = <Badge variant="destructive">Disabled</Badge>;

            return (
              <Card key={camp.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {camp.name} {statusBadge}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(camp.startDate), "MMM d, yyyy")} - {format(new Date(camp.endDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">Discount</p>
                    <p className="text-2xl font-bold text-primary">
                      {camp.discountMin === camp.discountMax 
                        ? `${camp.discountMin}%` 
                        : `${camp.discountMin}% - ${camp.discountMax}%`}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="text-sm font-semibold mb-3">Included Products ({camp.campaignProducts.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {camp.campaignProducts.map(cp => (
                      <Badge key={cp.id} variant="secondary" className="flex items-center gap-1">
                        {cp.product.title}
                        <span className="text-primary font-bold ml-1">{cp.discountPercentage}% Off</span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
