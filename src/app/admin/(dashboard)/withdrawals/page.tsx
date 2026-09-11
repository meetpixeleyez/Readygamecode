import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { WithdrawalActions } from "./withdrawal-actions";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Banknote, HelpCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface AdminWithdrawalsPageProps {
  searchParams: Promise<{ status?: string }>;
}

const statusMap: Record<number, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  0: { label: "Pending", variant: "secondary" },
  1: { label: "Approved/Paid", variant: "default" },
  2: { label: "Processing", variant: "outline" },
  3: { label: "Rejected", variant: "destructive" },
};

export default async function AdminWithdrawalsPage({ searchParams }: AdminWithdrawalsPageProps) {
  const { status: statusFilter } = await searchParams;
  const statusNum = statusFilter ? parseInt(statusFilter) : undefined;

  const withdrawals = await db.withdrawal.findMany({
    where: {
      ...(statusNum !== undefined ? { status: statusNum } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { username: true, email: true } },
    },
  });

  const allWithdrawals = await db.withdrawal.findMany({
    select: { status: true },
  });
  
  const statusCounts = allWithdrawals.reduce((acc, w) => {
    acc[w.status] = (acc[w.status] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Withdrawals Management</h1>
          <p className="text-muted-foreground mt-1">
            Review and process seller payout requests.
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Link
          href="/admin/withdrawals"
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            statusNum === undefined
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All Requests ({allWithdrawals.length})
        </Link>
        {[0, 1, 3].map((status) => {
          const count = statusCounts[status] || 0;
          return (
            <Link
              key={status}
              href={`/admin/withdrawals?status=${status}`}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statusNum === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {statusMap[status].label} ({count})
            </Link>
          );
        })}
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
        {withdrawals.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No withdrawal requests found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[500px] min-h-[460px] relative">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-muted-foreground bg-muted/95 backdrop-blur-xs uppercase border-b border-border sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Method</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Account Details</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {w.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{w.user.username}</div>
                      <div className="text-xs text-muted-foreground">{w.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 capitalize">
                        {w.methodId.includes('paypal') ? <Banknote className="h-4 w-4 text-blue-500" /> : 
                         w.methodId.includes('bank') ? <Banknote className="h-4 w-4 text-green-500" /> :
                         <CreditCard className="h-4 w-4 text-orange-500" />}
                        {w.methodId.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-orange-500">
                      {formatCurrency(w.amount)}
                      <div className="text-xs text-muted-foreground font-normal">
                        Charge: {formatCurrency(w.charge)}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[250px]">
                      <div className="text-xs bg-muted p-2 rounded truncate" title={w.withdrawInformation || ""}>
                        {w.withdrawInformation}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={statusMap[w.status]?.variant || "default"}>
                        {statusMap[w.status]?.label || "Unknown"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <WithdrawalActions withdrawalId={w.id} currentStatus={w.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
