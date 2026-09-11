import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function SellerRefundsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const refunds = await db.refundRequest.findMany({
    where: { userId: session.sub },
    include: {
      orderItem: {
        include: { product: true, user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Refund Requests</h1>
        <p className="text-muted-foreground mt-1">Manage refund requests from buyers for your products.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)] min-h-[380px] relative">
            <Table className="border-collapse">
              <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-xs shadow-2xs">
                <TableRow className="bg-muted/95 hover:bg-muted/95 border-b border-border">
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">Buyer</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No refund requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  refunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell className="font-medium">
                        {refund.orderItem.product.title}
                      </TableCell>
                      <TableCell>{refund.orderItem.user.username || refund.orderItem.user.firstname}</TableCell>
                      <TableCell>${refund.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={refund.status === 1 ? "default" : refund.status === 2 ? "destructive" : "secondary"}>
                          {refund.status === 1 ? "Approved" : refund.status === 2 ? "Declined" : "Pending Review"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(refund.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/seller/refunds/${refund.id}`}>View Details</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
