import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { broadcastNotification } from "@/lib/sse";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { DisputeReplyForm } from "@/components/refunds/reply-form";

export const dynamic = "force-dynamic";

export default async function RefundDisputePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const { id } = await params;
  const refund = await db.refundRequest.findUnique({
    where: { id, buyerId: session.sub },
    include: {
      orderItem: {
        include: { product: true },
      },
      activities: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!refund) notFound();

  // Mark as read for buyer
  if (refund.buyerUnreadCount > 0) {
    await db.refundRequest.update({
      where: { id },
      data: { buyerUnreadCount: 0 },
    });
    broadcastNotification(session.sub);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/purchases"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Refund Dispute</h1>
          <p className="text-muted-foreground">Request for {refund.orderItem.product.title}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={refund.status === 1 ? "default" : refund.status === 2 ? "destructive" : "secondary"}>
            {refund.status === 1 ? "Approved" : refund.status === 2 ? "Declined" : "Pending Review"}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Dispute Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {refund.activities.map((activity) => (
              <div
                key={activity.id}
                className={`flex flex-col p-4 rounded-lg max-w-[80%] ${
                  activity.buyerId === session.sub
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="flex justify-between items-end gap-4 mb-2 opacity-70 text-xs">
                  <span className="font-semibold">
                    {activity.buyerId === session.sub ? "You (Buyer)" : "Seller"}
                  </span>
                  <span>{new Date(activity.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{activity.message}</p>
              </div>
            ))}
          </div>

          {refund.status === 0 && (
            <div className="mt-8 border-t pt-6">
              <DisputeReplyForm refundId={refund.id} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
