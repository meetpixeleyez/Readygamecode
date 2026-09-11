"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Send, ShieldAlert, Package, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.ticket as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [ticket, setTicket] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  async function fetchData() {
    try {
      const userRes = await fetch("/api/auth/me");
      const userData = await userRes.json();
      setCurrentUser(userData.user);

      const res = await fetch(`/api/support/${ticketId}`);
      if (!res.ok) {
        if (res.status === 404) router.push("/dashboard/support");
        throw new Error("Failed to load ticket");
      }
      const data = await res.json();
      setTicket(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setIsReplying(true);
    try {
      const res = await fetch(`/api/support/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (!res.ok) throw new Error("Failed to send reply");
      
      setReplyMessage("");
      fetchData(); // reload
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsReplying(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!ticket || !currentUser) return null;

  const isClosed = ticket.status === 3;
  const iAmSeller = ticket.ticketType === "SELLER" && ticket.sellerId === currentUser.id;
  const iAmBuyer = ticket.userId === currentUser.id;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0">
          <Link href="/dashboard/support">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold truncate">{ticket.subject}</h1>
            {isClosed ? (
              <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 border-slate-500/20 shrink-0">Closed</Badge>
            ) : (
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 shrink-0">Active</Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4 flex-wrap">
            <span>Ticket #{ticket.ticket}</span>
            <span className="flex items-center gap-1.5">
              {ticket.ticketType === "SELLER" ? <Package className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {ticket.ticketType === "SELLER" ? "Product Support" : "Admin Support"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Chat Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-[60vh] flex flex-col overflow-hidden shadow-sm">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/20">
              {ticket.messages.map((msg: any) => {
                const isMine = msg.senderId === currentUser.id;
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                    <div className="flex items-end gap-2 max-w-[85%]">
                      <div className={`px-4 py-3 rounded-2xl whitespace-pre-wrap text-sm md:text-base shadow-sm ${
                        isMine 
                          ? "bg-primary text-primary-foreground rounded-br-sm" 
                          : msg.isAdmin
                          ? "bg-slate-800 text-white dark:bg-slate-700 rounded-bl-sm"
                          : "bg-card border rounded-bl-sm"
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1.5 px-1 flex items-center gap-2">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      {msg.isAdmin && !isMine && <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-primary/20 text-primary">ADMIN</Badge>}
                      {!isMine && !msg.isAdmin && (
                        <span className="font-medium">
                          {iAmSeller ? ticket.name : "Seller"}
                        </span>
                      )}
                      {isMine && <span className="font-medium">You</span>}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {!isClosed ? (
              <div className="p-4 bg-card border-t">
                <form onSubmit={handleReply} className="relative">
                  <Textarea 
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    className="min-h-[60px] max-h-[200px] pr-14 resize-none bg-background rounded-xl border-muted-foreground/20 focus-visible:ring-primary/30"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReply(e as any);
                      }
                    }}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isReplying || !replyMessage.trim()}
                    className="absolute right-2 bottom-2 h-8 w-8 rounded-full"
                  >
                    {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                  </Button>
                </form>
                <div className="text-[11px] text-muted-foreground text-center mt-2">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 border-t text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" /> This ticket is closed. You cannot reply.
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-6">
          {ticket.product && (
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Package className="w-4 h-4" /> About This Product
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative h-40 w-full bg-muted">
                  <Image 
                    src={ticket.product.thumbnail || "/products/placeholder.svg"} 
                    alt={ticket.product.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-5 space-y-4">
                  <h3 className="font-semibold line-clamp-2 leading-tight">
                    {ticket.product.title}
                  </h3>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/game-source-code/${ticket.product.slug}`} target="_blank">
                      View Product Page
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{isClosed ? "Closed" : "Active"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Priority</span>
                <span className="font-medium">
                  {ticket.priority === 3 ? <span className="text-red-500">High</span> : ticket.priority === 2 ? "Medium" : "Low"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              {ticket.ticketType === "SELLER" && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium">
                    {iAmSeller ? <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10">You are the Seller</Badge> : "You are the Buyer"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
