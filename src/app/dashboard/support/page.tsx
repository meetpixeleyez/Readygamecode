"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, MessageSquare, Clock, Tag, User } from "lucide-react";

export default function UserSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch user to know who we are (to separate my tickets vs customer tickets)
      const userRes = await fetch("/api/auth/me");
      const userData = await userRes.json();
      if (userData?.user?.id) {
        setUserId(userData.user.id);
      }

      const res = await fetch("/api/support");
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
      case 0: return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Open</Badge>;
      case 1: return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Answered</Badge>;
      case 2: return <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">Awaiting Reply</Badge>;
      case 3: return <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">Closed</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  const myTickets = tickets.filter(t => t.userId === userId);
  const customerTickets = tickets.filter(t => t.sellerId === userId);

  const TicketCard = ({ ticket }: { ticket: any }) => (
    <Card className="group hover:border-primary/50 hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                #{ticket.ticket}
              </span>
              {getStatusBadge(ticket.status)}
              {ticket.ticketType === "SELLER" && (
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">Product Support</Badge>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                {ticket.subject}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {new Date(ticket.updatedAt).toLocaleDateString()}
                </span>
                {ticket.ticketType === "SELLER" && ticket.userId !== userId && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    Customer: {ticket.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center md:flex-col gap-3 md:items-end shrink-0">
            <Link href={`/dashboard/support/${ticket.id}`} className="w-full">
              <Button className="w-full md:w-auto" variant={ticket.status === 0 || ticket.status === 2 ? "default" : "secondary"}>
                <MessageSquare className="w-4 h-4 mr-2" /> 
                {ticket.status === 0 || ticket.status === 2 ? "Reply Now" : "View Thread"}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 -mx-6 px-6 sm:mx-0 sm:rounded-2xl border border-primary/10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Inbox</h1>
          <p className="text-muted-foreground mt-1">Manage your helpdesk tickets and product support queries.</p>
        </div>
        <Link href="/dashboard/support/new">
          <Button size="lg" className="shadow-lg hover:shadow-primary/25 transition-all">
            <Plus className="mr-2 h-5 w-5" /> Open New Ticket
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="my-tickets" className="w-full">
          {customerTickets.length > 0 && (
            <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="my-tickets">My Tickets ({myTickets.length})</TabsTrigger>
              <TabsTrigger value="customer-tickets">Customer Tickets ({customerTickets.length})</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="my-tickets" className="space-y-4">
            {myTickets.length === 0 ? (
              <div className="text-center py-20 bg-muted/30 border border-dashed rounded-2xl">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No tickets opened</h3>
                <p className="text-muted-foreground mt-1">You haven't opened any support tickets yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {myTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="customer-tickets" className="space-y-4">
            {customerTickets.length === 0 ? (
              <div className="text-center py-20 bg-muted/30 border border-dashed rounded-2xl">
                <h3 className="text-lg font-medium">No customer tickets</h3>
                <p className="text-muted-foreground mt-1">None of your buyers have requested support yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {customerTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
