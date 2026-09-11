import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Transaction History | Ready Game Code",
  description: "View your passbook and transaction history",
};

export default async function TransactionsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard/transactions");
  }

  const transactions = await db.transaction.findMany({
    where: { userId: user.sub },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Transaction History</h2>
        <p className="text-muted-foreground text-sm">
          A complete record of your wallet deposits, purchases, and refunds.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Passbook</CardTitle>
          <CardDescription>
            All balance changes are recorded here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border-t border-border mt-2 border-dashed rounded-lg">
              No transactions found.
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)] min-h-[380px] relative">
              <Table className="border-collapse">
                <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-xs shadow-2xs">
                  <TableRow className="bg-muted/95 hover:bg-muted/95 border-b border-border">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Trx ID</TableHead>
                    <TableHead className="font-semibold">Details</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="text-right font-semibold">Post Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((trx) => (
                    <TableRow key={trx.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(trx.createdAt), "dd MMM yyyy, hh:mm a")}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {trx.trx || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{trx.details || "Transaction"}</div>
                        {trx.remark && (
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] uppercase mt-1 ${
                              ["deposit", "new_sale", "refund"].includes(trx.remark)
                                ? "border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10"
                                : ["purchase", "withdraw", "seller_fee"].includes(trx.remark)
                                ? "border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10"
                                : "bg-secondary"
                            }`}
                          >
                            {trx.remark.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            trx.trxType === "+" ? "text-green-500" : "text-destructive"
                          }`}
                        >
                          {trx.trxType === "+" ? "+" : "-"}${trx.amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${trx.postBalance.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
