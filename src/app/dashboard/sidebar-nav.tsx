"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Download, User, Store, Heart, Folder, LifeBuoy, ShieldAlert, Wallet, History } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { useNotifications } from "@/hooks/use-notifications";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/dashboard", label: "Buyer Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/purchases", label: "Purchases", icon: Package },
  { href: "/dashboard/downloads", label: "Downloads", icon: Download },
  { href: "/dashboard/favorites", label: "Favorites", icon: Heart },
  { href: "/dashboard/collections", label: "Collections", icon: Folder },
  { href: "/dashboard/deposit", label: "Add Funds", icon: Wallet },
  { href: "/dashboard/transactions", label: "Transactions", icon: History },

  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export function SidebarNav({ isAuthor }: { isAuthor: boolean }) {
  const pathname = usePathname();
  const { buyer } = useNotifications();

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
            {item.label === "Purchases" && buyer.refunds > 0 && (
              <Badge variant={isActive ? "secondary" : "destructive"} className="px-1.5 py-0 min-w-5 h-5 flex items-center justify-center text-[10px]">
                {buyer.refunds}
              </Badge>
            )}
            {item.label === "Support" && buyer.support > 0 && (
              <Badge variant={isActive ? "secondary" : "destructive"} className="px-1.5 py-0 min-w-5 h-5 flex items-center justify-center text-[10px]">
                {buyer.support}
              </Badge>
            )}
          </Link>
        );
      })}
      
      {isAuthor && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Seller Portal
          </p>
          <Link
            href="/seller"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-medium"
          >
            <Store className="h-4 w-4 text-primary" />
            Seller Dashboard
          </Link>
        </div>
      )}

      <div className="pt-2 mt-4 border-t border-border">
        <LogoutButton
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        />
      </div>
    </nav>
  );
}
