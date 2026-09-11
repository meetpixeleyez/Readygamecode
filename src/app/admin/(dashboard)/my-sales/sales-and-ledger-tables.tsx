"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  CreditCard,
  Search,
  Calendar as CalendarIcon,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  User,
  X,
  Sparkles,
} from "lucide-react";

export type OrderItemWithDetails = {
  id: string;
  purchaseCode: string | null;
  productPrice: number;
  sellerEarning: number;
  isRefunded: number;
  license: number;
  createdAt: Date;
  product: {
    id: string;
    title: string;
    slug: string;
  };
  user: {
    id: string;
    username: string | null;
    email: string | null;
    firstname: string | null;
    lastname: string | null;
  } | null;
};

export type TransactionItem = {
  id: string;
  trx: string | null;
  trxType: string | null;
  remark: string | null;
  amount: number;
  postBalance: number;
  createdAt: Date;
};

interface SalesAndLedgerTablesProps {
  orderItems: OrderItemWithDetails[];
  transactions: TransactionItem[];
}

const remarkLabels: Record<string, string> = {
  new_sale: "Product Sale",
  seller_fee: "Platform Fee",
  payment: "Payment Received",
  purchase: "Item Purchased",
  balance_add: "Balance Added",
  withdrawal: "Withdrawal",
  refund_debit: "Refund Debit",
  refund_credit: "Refund Credit",
};

export function SalesAndLedgerTables({
  orderItems,
  transactions,
}: SalesAndLedgerTablesProps) {
  // State for search and date filters
  const [searchQuery, setSearchQuery] = useState("");
  const [datePreset, setDatePreset] = useState<"all" | "today" | "7days" | "30days">("all");
  const [salesStatusFilter, setSalesStatusFilter] = useState<"all" | "active" | "refunded">("all");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<"all" | "credit" | "debit">("all");

  // Helper date filtering function
  const isWithinDatePreset = (date: Date) => {
    if (datePreset === "all") return true;
    const now = new Date();
    const itemDate = new Date(date);

    if (datePreset === "today") {
      return (
        itemDate.getDate() === now.getDate() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getFullYear() === now.getFullYear()
      );
    }
    if (datePreset === "7days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return itemDate >= sevenDaysAgo;
    }
    if (datePreset === "30days") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return itemDate >= thirtyDaysAgo;
    }
    return true;
  };

  // Filtered sales orders
  const filteredOrderItems = useMemo(() => {
    return orderItems.filter((item) => {
      // 1. Date filter
      if (!isWithinDatePreset(item.createdAt)) return false;

      // 2. Status filter
      if (salesStatusFilter === "active" && item.isRefunded === 1) return false;
      if (salesStatusFilter === "refunded" && item.isRefunded !== 1) return false;

      // 3. Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = (item.product?.title || "").toLowerCase();
      const code = (item.purchaseCode || item.id || "").toLowerCase();
      const buyer = (
        item.user?.username ||
        item.user?.email ||
        item.user?.firstname ||
        ""
      ).toLowerCase();

      return title.includes(q) || code.includes(q) || buyer.includes(q);
    });
  }, [orderItems, searchQuery, datePreset, salesStatusFilter]);

  // Filtered transactions ledger
  const filteredTransactions = useMemo(() => {
    return transactions.filter((trx) => {
      // 1. Date filter
      if (!isWithinDatePreset(trx.createdAt)) return false;

      // 2. Type filter
      if (ledgerTypeFilter === "credit" && trx.trxType !== "+") return false;
      if (ledgerTypeFilter === "debit" && trx.trxType !== "-") return false;

      // 3. Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const trxId = (trx.trx || trx.id || "").toLowerCase();
      const remarkText = (remarkLabels[trx.remark || ""] || trx.remark || "").toLowerCase();

      return trxId.includes(q) || remarkText.includes(q);
    });
  }, [transactions, searchQuery, datePreset, ledgerTypeFilter]);

  return (
    <div className="space-y-6">
      {/* Global Filter Toolbar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Real-time Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by product, purchase code, buyer, or TRX ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 text-xs sm:text-sm bg-background/80 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 shrink-0 mr-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              Date:
            </span>
            {(
              [
                { id: "all", label: "All Time" },
                { id: "today", label: "Today" },
                { id: "7days", label: "Last 7 Days" },
                { id: "30days", label: "This Month" },
              ] as const
            ).map((preset) => (
              <Button
                key={preset.id}
                type="button"
                variant={datePreset === preset.id ? "default" : "outline"}
                size="sm"
                className="text-xs rounded-lg px-3 h-8 font-medium shrink-0"
                onClick={() => setDatePreset(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 1: Sales Orders History */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4.5 w-4.5 text-primary" />
            <h2 className="font-bold text-base tracking-tight">Recent Sales Orders</h2>
            <Badge variant="secondary" className="text-xs font-bold rounded-full">
              {filteredOrderItems.length} {filteredOrderItems.length === 1 ? "Order" : "Orders"}
            </Badge>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-background border border-border/80 p-0.5 rounded-lg text-xs self-start sm:self-auto">
            {(
              [
                { id: "all", label: "All Sales" },
                { id: "active", label: "Active" },
                { id: "refunded", label: "Refunded" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSalesStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                  salesStatusFilter === tab.id
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredOrderItems.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="font-bold text-foreground">No matching sales orders found</p>
            <p className="text-xs mt-1">Try clearing your search query or changing your date filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[200px] relative">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="text-xs text-muted-foreground bg-muted/95 backdrop-blur-xs uppercase border-b border-border sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="px-4 py-3 font-semibold">Purchase Code</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Buyer</th>
                  <th className="px-4 py-3 font-semibold">License</th>
                  <th className="px-4 py-3 font-semibold">Earnings</th>
                  <th className="px-4 py-3 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrderItems.map((item) => {
                  const buyerName =
                    item.user?.username ||
                    `${item.user?.firstname || ""} ${item.user?.lastname || ""}`.trim() ||
                    item.user?.email ||
                    "Buyer";

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {item.purchaseCode || item.id.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/game-source-code/${item.product.slug}`}
                          target="_blank"
                          className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 inline-flex items-center gap-1 text-xs sm:text-sm"
                        >
                          {item.product.title}
                          <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3.5 w-3.5 text-muted-foreground/80" />
                          <span className="font-medium text-foreground">{buyerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[11px] font-medium">
                            {item.license === 2 ? "Commercial" : "Personal"}
                          </Badge>
                          {item.isRefunded === 1 && (
                            <Badge
                              variant="destructive"
                              className="text-[11px] bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 font-semibold px-2 py-0.5 rounded-full"
                            >
                              Refunded
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-xs sm:text-sm">
                        {item.isRefunded === 1 ? (
                          <div className="flex flex-col">
                            <span className="line-through text-muted-foreground/70 text-xs font-normal">
                              {formatCurrency(item.sellerEarning || item.productPrice)}
                            </span>
                            <span className="text-rose-500 dark:text-rose-400 text-xs font-semibold">
                              $0.00 (Refunded)
                            </span>
                          </div>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.sellerEarning || item.productPrice)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground text-right whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Financial Ledger Transactions */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4.5 w-4.5 text-emerald-500" />
            <h2 className="font-bold text-base tracking-tight">Financial Transactions Ledger</h2>
            <Badge variant="outline" className="text-xs font-bold rounded-full">
              {filteredTransactions.length} Records
            </Badge>
          </div>

          {/* Ledger Type Filter Tabs */}
          <div className="flex items-center gap-1 bg-background border border-border/80 p-0.5 rounded-lg text-xs self-start sm:self-auto">
            {(
              [
                { id: "all", label: "All Ledger" },
                { id: "credit", label: "Credits (+)" },
                { id: "debit", label: "Debits (-)" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLedgerTypeFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                  ledgerTypeFilter === tab.id
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="font-bold text-foreground">No matching ledger records found</p>
            <p className="text-xs mt-1">Try clearing your search query or changing your date filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[200px] relative">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="text-xs text-muted-foreground bg-muted/95 backdrop-blur-xs uppercase border-b border-border sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="px-4 py-3 font-semibold">TRX</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Post Balance</th>
                  <th className="px-4 py-3 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.map((trx) => {
                  const isCredit = trx.trxType === "+";
                  const remarkText = remarkLabels[trx.remark || ""] || trx.remark || "Transaction";

                  return (
                    <tr key={trx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {trx.trx || trx.id.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCredit
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isCredit ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                          </span>
                          <span className="font-semibold text-foreground text-xs sm:text-sm">
                            {remarkText}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-xs sm:text-sm">
                        <span
                          className={
                            isCredit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {isCredit ? "+" : "-"}
                          {formatCurrency(trx.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-muted-foreground text-xs sm:text-sm">
                        {formatCurrency(trx.postBalance)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground text-right whitespace-nowrap">
                        {new Date(trx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
