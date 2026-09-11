"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { UserActions } from "./user-actions";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  Globe,
  Wallet,
  Calendar,
  ShoppingBag,
  Package,
  ShieldCheck,
  Ban,
  CheckCircle,
} from "lucide-react";

export interface UserRowData {
  id: string;
  firstname: string | null;
  lastname: string | null;
  username: string | null;
  email: string;
  dialCode: string | null;
  mobile: string | null;
  countryName: string | null;
  countryCode: string | null;
  state?: string | null;
  city?: string | null;
  role: string;
  isAuthor: number;
  balance: number;
  status: number;
  totalSold: number;
  totalSoldAmount: number;
  createdAt: Date | string;
  _count: {
    products: number;
    orders: number;
  };
}

interface UserTableProps {
  users: UserRowData[];
}

export function UserTable({ users }: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<UserRowData | null>(null);

  return (
    <>
      <div className="overflow-x-auto overflow-y-auto max-h-[500px] min-h-[460px] relative">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-muted-foreground bg-muted/95 backdrop-blur-xs uppercase border-b border-border sticky top-0 z-10 shadow-2xs">
            <tr>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Balance</th>
              <th className="px-6 py-4 font-medium">Stats</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="hover:bg-accent/40 cursor-pointer transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="font-bold text-primary">
                        {(user.firstname || user.username || user.email.charAt(0) || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate group-hover:text-primary transition-colors">
                        {user.firstname || user.lastname ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : user.username || "No Name"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {user.email} {user.username ? `· ${user.username}` : ""}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isAuthor === 1 ? (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Seller</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20">Buyer</Badge>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {formatCurrency(user.balance || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                  <div>Orders: {user._count.orders}</div>
                  {user.isAuthor === 1 && <div>Products: {user._count.products}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.status === 1 ? (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Banned</Badge>
                  )}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <UserActions userId={user.id} currentStatus={user.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        {selectedUser && (
          <DialogContent className="max-w-md sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-primary">
                    {(selectedUser.firstname || selectedUser.username || selectedUser.email.charAt(0)).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    {selectedUser.firstname || selectedUser.lastname
                      ? `${selectedUser.firstname || ''} ${selectedUser.lastname || ''}`.trim()
                      : selectedUser.username || "User Details"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <span>@{selectedUser.username || "no-username"}</span>
                    <span>·</span>
                    <span className="capitalize">{selectedUser.role.toLowerCase()}</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Primary Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg bg-muted/30 space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <User className="h-3.5 w-3.5 text-primary" /> Full Name
                  </div>
                  <div className="text-sm font-semibold truncate">
                    {selectedUser.firstname || selectedUser.lastname
                      ? `${selectedUser.firstname || ''} ${selectedUser.lastname || ''}`.trim()
                      : "N/A"}
                  </div>
                </div>

                <div className="p-3 border rounded-lg bg-muted/30 space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Mail className="h-3.5 w-3.5 text-primary" /> Email
                  </div>
                  <div className="text-sm font-semibold truncate" title={selectedUser.email}>
                    {selectedUser.email}
                  </div>
                </div>

                <div className="p-3 border rounded-lg bg-muted/30 space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Phone className="h-3.5 w-3.5 text-primary" /> Phone Number
                  </div>
                  <div className="text-sm font-semibold truncate">
                    {selectedUser.mobile
                      ? `${selectedUser.dialCode ? selectedUser.dialCode + ' ' : ''}${selectedUser.mobile}`
                      : "N/A"}
                  </div>
                </div>

                <div className="p-3 border rounded-lg bg-muted/30 space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Globe className="h-3.5 w-3.5 text-primary" /> Location
                  </div>
                  <div className="text-sm font-semibold truncate">
                    {[selectedUser.city, selectedUser.state, selectedUser.countryName || selectedUser.countryCode].filter(Boolean).join(", ") || "N/A"}
                  </div>
                </div>
              </div>

              {/* Status & Account Metrics */}
              <div className="border rounded-lg p-4 bg-card space-y-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Account Overview</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Account Status</span>
                    <div className="mt-1">
                      {selectedUser.status === 1 ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Banned</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Account Type</span>
                    <div className="mt-1">
                      {selectedUser.isAuthor === 1 ? (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Seller</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20">Buyer</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Wallet Balance</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {formatCurrency(selectedUser.balance || 0)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <span>Orders Placed: <strong>{selectedUser._count.orders}</strong></span>
                  </div>
                  {selectedUser.isAuthor === 1 && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>Products Uploaded: <strong>{selectedUser._count.products}</strong></span>
                    </div>
                  )}
                  {selectedUser.isAuthor === 1 && (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <span>Total Sales: <strong>{selectedUser.totalSold} ({formatCurrency(selectedUser.totalSoldAmount)})</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined: <strong>{new Date(selectedUser.createdAt).toLocaleDateString()}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Footer in Modal */}
              <div className="flex justify-end pt-2">
                <UserActions userId={selectedUser.id} currentStatus={selectedUser.status} />
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
