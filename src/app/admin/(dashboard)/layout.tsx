import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { MobileNavSelect } from "./mobile-nav";
import { ShieldCheck } from "lucide-react";
import { AdminNav } from "./admin-nav";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const mobileNavItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/withdrawals", label: "Withdrawals" },
  { href: "/admin/refunds", label: "Refunds" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/support", label: "Helpdesk" },
];



export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();
  const sessionRole = session?.role ? String(session.role).toLowerCase() : "";
  if (!session || sessionRole !== "admin") {
    redirect("/admin/login");
  }

  const admin = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      username: true,
      email: true,
      role: true,
    },
  });

  const dbRole = admin?.role ? String(admin.role).toLowerCase() : "";
  if (!admin || dbRole !== "admin") {
    redirect("/admin/login");
  }

  const displayName = admin.firstname || admin.username || "Admin";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1 border-r pr-4 border-border hidden lg:block">
          <div className="sticky top-24 space-y-4">
            {/* Admin card */}
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-primary text-xl">{initials}</span>
              </div>
              <div className="font-medium truncate">{displayName}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <ShieldCheck className="h-3 w-3 text-primary" />
                Administrator
              </div>
            </div>

            {/* Navigation */}
            <AdminNav />
          </div>
        </aside>

        {/* Mobile Navigation Dropdown (simplified) */}
        <div className="lg:hidden mb-6 flex justify-between items-center bg-card border rounded-lg p-3">
           <div className="flex items-center gap-2">
             <ShieldCheck className="h-5 w-5 text-primary" />
             <span className="font-medium">Admin Panel</span>
           </div>
           <MobileNavSelect navItems={mobileNavItems} />
        </div>

        {/* Main content */}
        <main className="lg:col-span-4">
          {children}
        </main>
      </div>
    </div>
  );
}
