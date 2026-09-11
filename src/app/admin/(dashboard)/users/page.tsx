import Link from "next/link";
import { db } from "@/lib/db";
import { UserSearch } from "./user-search";
import { UserTable } from "./user-table";

export const dynamic = "force-dynamic";

interface AdminUsersPageProps {
  searchParams: Promise<{ filter?: string; q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { filter, q } = await searchParams;
  
  let whereClause: any = { role: { notIn: ["ADMIN"] } };
  if (filter === "sellers") {
    whereClause.isAuthor = 1;
  } else if (filter === "buyers") {
    whereClause.isAuthor = 0;
  }

  if (q) {
    whereClause.OR = [
      { firstname: { contains: q, mode: "insensitive" } },
      { lastname: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
    ];
  }

  const users = await db.user.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      username: true,
      email: true,
      dialCode: true,
      mobile: true,
      countryName: true,
      countryCode: true,
      role: true,
      isAuthor: true,
      balance: true,
      status: true,
      totalSold: true,
      totalSoldAmount: true,
      createdAt: true,
      _count: {
        select: { products: true, orders: true }
      }
    }
  });

  const baseCountWhere = { role: { notIn: ["ADMIN"] as any } };
  const totalUsers = await db.user.count({ where: baseCountWhere });
  const totalSellers = await db.user.count({ where: { ...baseCountWhere, isAuthor: 1 } });
  const totalBuyers = totalUsers - totalSellers;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage buyers and sellers. Click on any user row to view details.
          </p>
        </div>
        <UserSearch />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Link
          href="/admin/users"
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !filter
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All Users ({totalUsers})
        </Link>
        <Link
          href="/admin/users?filter=buyers"
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filter === "buyers"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Buyers ({totalBuyers})
        </Link>
        <Link
          href="/admin/users?filter=sellers"
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filter === "sellers"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Sellers ({totalSellers})
        </Link>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
        {users.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No users found.
          </div>
        ) : (
          <UserTable users={users} />
        )}
      </div>
    </div>
  );
}
