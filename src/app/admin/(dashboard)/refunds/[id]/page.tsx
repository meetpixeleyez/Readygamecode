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
import { RefundActionButtons } from "@/components/refunds/action-buttons";

export const dynamic = "force-dynamic";

export default async function AdminRefundDisputePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "admin" && session.role !== "ADMIN")) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const refund = await db.refundRequest.findUnique({
    where: { id, userId: session.sub },
    include: {
      orderItem: {
        include: { product: true, user: true },
      },
      activities: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!refund) notFound();

  // Mark as read for seller/admin
  if (refund.sellerUnreadCount > 0) {
    await db.refundRequest.update({
      where: { id },
      data: { sellerUnreadCount: 0 },
    });
    broadcastNotification(session.sub);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/refunds"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Refund</h1>
          <p className="text-muted-foreground">Dispute from {refund.orderItem.user.username || "Buyer"}</p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Badge variant={refund.status === 1 ? "default" : refund.status === 2 ? "destructive" : "secondary"}>
            {refund.status === 1 ? "Approved" : refund.status === 2 ? "Declined" : "Pending Review"}
          </Badge>
          {refund.status === 0 && <RefundActionButtons refundId={refund.id} />}
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
                  activity.sellerId === session.sub
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="flex justify-between items-end gap-4 mb-2 opacity-70 text-xs">
                  <span className="font-semibold">
                    {activity.sellerId === session.sub ? "You (Admin)" : "Buyer"}
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
