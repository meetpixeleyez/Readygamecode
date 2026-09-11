"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Search, Filter, HeadphonesIcon } from "lucide-react";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    try {
      const res = await fetch("/api/admin/support");
      const data = await res.json();
      if (res.ok) {
        setTickets(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0: return <Badge variant="secondary" className="bg-sky-500/15 text-sky-600 hover:bg-sky-500/25">Open</Badge>;
      case 1: return <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25">Answered</Badge>;
      case 2: return <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25">Customer Reply</Badge>;
      case 3: return <Badge variant="secondary" className="bg-slate-500/15 text-slate-600 hover:bg-slate-500/25">Closed</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1: return <Badge variant="outline" className="text-muted-foreground border-border">Low</Badge>;
      case 2: return <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-950/30">Medium</Badge>;
      case 3: return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30">High</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Helpdesk</h1>
          <p className="text-muted-foreground mt-2">Manage customer support tickets and inquiries.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>Support Inbox</CardTitle>
              <CardDescription>All incoming tickets requiring attention.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tickets..."
                  className="pl-8 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-x-auto overflow-y-auto max-h-[500px] min-h-[460px] relative">
            <Table className="border-collapse">
              <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-xs shadow-2xs">
                <TableRow className="bg-muted/95 hover:bg-muted/95 border-b border-border">
                  <TableHead className="w-[100px] font-semibold">Ticket ID</TableHead>
                  <TableHead className="w-[250px] font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Subject</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Priority</TableHead>
                  <TableHead className="font-semibold">Last Updated</TableHead>
                  <TableHead className="text-right font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <HeadphonesIcon className="h-12 w-12 mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-medium text-foreground">Inbox Zero!</h3>
                        <p className="text-sm mt-1">There are no support tickets in the queue.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.filter(ticket => {
                    const searchLower = searchQuery.toLowerCase();
                    const ticketId = (ticket.ticket || "").toLowerCase();
                    const name = (ticket.name || "").toLowerCase();
                    const email = (ticket.email || "").toLowerCase();
                    const subject = (ticket.subject || "").toLowerCase();
                    return ticketId.includes(searchLower) || name.includes(searchLower) || email.includes(searchLower) || subject.includes(searchLower);
                  }).map((ticket) => (
                    <TableRow key={ticket.id} className="group">
                      <TableCell className="font-mono text-xs text-muted-foreground">#{ticket.ticket}</TableCell>
                      <TableCell>
                        <div className="font-medium">{ticket.name}</div>
                        <div className="text-xs text-muted-foreground">{ticket.email}</div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[250px] truncate">{ticket.subject}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(ticket.updatedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/support/${ticket.id}`}>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MessageSquare className="h-4 w-4 mr-2" /> View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
