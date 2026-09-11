import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { Store, ArrowRight, Star } from "lucide-react";
import { SellerSidebarNav } from "./seller-sidebar-nav";
import { MobileNavSelect } from "../admin/(dashboard)/mobile-nav";

import type { Metadata } from "next";

const sellerNavItems = [
  { href: "/seller", label: "Dashboard" },
  { href: "/seller/products", label: "My Products" },
  { href: "/seller/earnings", label: "Earnings" },
  { href: "/seller/withdrawals", label: "Withdrawals" },
  { href: "/seller/refunds", label: "Refunds" },
  { href: "/seller/campaigns", label: "Campaigns" },
  { href: "/seller/reviews", label: "Reviews" },
  { href: "/dashboard", label: "Buyer Portal" },
];

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?redirect=/seller");
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
      totalSold: true,
      totalSoldAmount: true,
      avgRating: true,
      totalReview: true,
    },
  });

  if (!user) {
    redirect("/login");
  }



  // If not an author, show "become an author" prompt
  if (user.isAuthor !== 1) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center rounded-lg border border-border bg-card p-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Become a Seller</h1>
          <p className="text-sm text-muted-foreground mb-6">
            You need to become an author to access the seller dashboard. Complete
            the author application to start selling your game source codes.
          </p>
          <Button asChild>
            <Link href="/register?role=seller">
              Register as an Author
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayName = user.firstname || user.username || "Seller";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Mobile Navigation Header */}
      <div className="lg:hidden mb-6 flex justify-between items-center bg-card border border-border rounded-xl p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Seller Portal</span>
        </div>
        <MobileNavSelect navItems={sellerNavItems} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-24 space-y-4">
            {/* Seller card */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-bold text-primary text-lg">{initials}</span>
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{displayName}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    Seller Account
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Balance</div>
                  <div className="font-bold text-primary">${user.balance.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Sales</div>
                  <div className="font-bold">{user.totalSold}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Revenue</div>
                  <div className="font-bold">${user.totalSoldAmount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Rating</div>
                  <div className="font-bold flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    {user.avgRating.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <SellerSidebarNav />
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
