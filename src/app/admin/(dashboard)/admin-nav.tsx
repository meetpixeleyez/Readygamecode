"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  LayoutDashboard,
  Users,
  Package,
  PackageCheck,
  Download,
  FolderTree,
  FileText,
  LifeBuoy,
  Undo2,
  ShoppingBag,
  DollarSign,
  CreditCard,
} from "lucide-react";

import { useNotifications } from "@/hooks/use-notifications";
import { Badge } from "@/components/ui/badge";

export const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/products", label: "All Platform Products", icon: Package },
  { href: "/admin/my-products", label: "My Products", icon: PackageCheck },
  { href: "/admin/my-sales", label: "My Sales & Earnings", icon: DollarSign },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: Download },
  { href: "/admin/refunds", label: "Refunds", icon: Undo2 },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/support", label: "Helpdesk", icon: LifeBuoy },
  { href: "/admin/settings/payment", label: "Payment Settings", icon: CreditCard },
];

export function AdminNav() {
  const pathname = usePathname();
  const { admin } = useNotifications();
  
  return (
    <nav className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
      {adminNavItems.map((item) => {
        const isActive = item.href === "/admin" 
          ? pathname === "/admin" 
          : pathname.startsWith(item.href);
          
        let badgeCount = 0;
        if (item.href === "/admin/refunds") badgeCount = admin?.refunds || 0;
        if (item.href === "/admin/support") badgeCount = admin?.support || 0;
        if (item.href === "/admin/products") badgeCount = admin?.pendingProducts || 0;
        if (item.href === "/admin/withdrawals") badgeCount = admin?.withdrawals || 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors border-b border-border last:border-0",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              {item.label}
            </div>

            {badgeCount > 0 && (
              <Badge
                variant={isActive ? "secondary" : item.href === "/admin/refunds" ? "destructive" : "default"}
                className="px-1.5 py-0 min-w-5 h-5 flex items-center justify-center text-[10px] shadow-xs font-bold"
              >
                {badgeCount}
              </Badge>
            )}
          </Link>
        );
      })}
      <div className="p-2 border-t border-border">
        <LogoutButton />
      </div>
    </nav>
  );
}
