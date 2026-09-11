"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Wallet,
  Download,
  Star,
  RefreshCcw,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { useNotifications } from "@/hooks/use-notifications";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/seller", label: "Seller Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/seller/products", label: "My Products", icon: Package },
  { href: "/seller/earnings", label: "Earnings", icon: Wallet },
  { href: "/seller/withdrawals", label: "Withdrawals", icon: Download },
  { href: "/seller/refunds", label: "Refunds", icon: RefreshCcw },
  { href: "/seller/campaigns", label: "Campaigns", icon: Star },
  { href: "/seller/reviews", label: "Reviews", icon: Star },
];

export function SellerSidebarNav() {
  const pathname = usePathname();
  const { seller } = useNotifications();

  return (
    <nav className="rounded-lg border border-border bg-card p-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
              isActive 
                ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                : "hover:bg-accent text-foreground"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`h-4 w-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
              {item.label}
            </div>
            {item.label === "Refunds" && seller.refunds > 0 && (
              <Badge variant={isActive ? "secondary" : "destructive"} className="px-1.5 py-0 min-w-5 h-5 flex items-center justify-center text-[10px]">
                {seller.refunds}
              </Badge>
            )}
          </Link>
        );
      })}

      <div className="mt-4 pt-4 border-t border-border">
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Buyer Portal
        </p>
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-medium"
        >
          <LayoutDashboard className="h-4 w-4 text-primary" />
          Buyer Dashboard
        </Link>
      </div>

      <div className="pt-2 mt-4 border-t border-border">
        <LogoutButton
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        />
      </div>
    </nav>
  );
}
