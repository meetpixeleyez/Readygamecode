import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SidebarNav } from "./sidebar-nav";
import { MobileNavSelect } from "../admin/(dashboard)/mobile-nav";
import { User } from "lucide-react";
import type { Metadata } from "next";

const buyerNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/purchases", label: "My Purchases" },
  { href: "/dashboard/downloads", label: "Downloads" },
  { href: "/dashboard/favorites", label: "Favorites" },
  { href: "/dashboard/transactions", label: "Transactions" },
  { href: "/dashboard/deposit", label: "Deposit" },
  { href: "/dashboard/support", label: "Support Tickets" },
  { href: "/dashboard/profile", label: "Profile Settings" },
];

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?redirect=/dashboard");
  }

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      username: true,
      email: true,
      isAuthor: true,
      balance: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const displayName = user.firstname || user.username || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Mobile Navigation Header */}
      <div className="lg:hidden mb-6 flex justify-between items-center bg-card border border-border rounded-xl p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">User Dashboard</span>
        </div>
        <MobileNavSelect navItems={buyerNavItems} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-24 space-y-4">
            {/* User card */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-bold text-primary text-lg">{initials}</span>
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">
                    {displayName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground">Balance</div>
                <div className="font-bold text-primary">${user.balance.toFixed(2)}</div>
              </div>
            </div>

            {/* Nav */}
            <SidebarNav isAuthor={user.isAuthor === 1} />
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  );
}
