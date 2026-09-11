"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Send, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AdminTicketDetailPage() {
  const params = useParams();
  const ticketId = params.ticket as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  async function fetchTicket() {
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`);
      if (!res.ok) {
        if (res.status === 404) router.push("/admin/support");
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
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (!res.ok) throw new Error("Failed to send reply");
      
      toast({ title: "Reply sent!" });
      setReplyMessage("");
      fetchTicket();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsReplying(false);
    }
  }

  async function handleCloseTicket() {
    if (!confirm("Are you sure you want to close this ticket?")) return;
    setIsClosing(true);
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 3 }), // 3 = closed
      });

      if (!res.ok) throw new Error("Failed to close ticket");
      
      toast({ title: "Ticket closed" });
      fetchTicket();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsClosing(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!ticket) return null;

  const isClosed = ticket.status === 3;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/support">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Ticket #{ticket.ticket}
              {isClosed ? <Badge variant="secondary">Closed</Badge> : <Badge className="bg-blue-500">Open</Badge>}
            </h1>
            <p className="text-muted-foreground">{ticket.subject} - {ticket.name} ({ticket.email})</p>
          </div>
        </div>
        {!isClosed && (
          <Button variant="destructive" onClick={handleCloseTicket} disabled={isClosing}>
            {isClosing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Close Ticket
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {ticket.messages.map((msg: any) => (
          <div key={msg.id} className="p-4 border rounded-lg bg-card">
            <div className="text-xs text-muted-foreground mb-2">
              {new Date(msg.createdAt).toLocaleString()}
            </div>
            <div className="whitespace-pre-wrap">{msg.message}</div>
          </div>
        ))}
      </div>

      {!isClosed && (
        <form onSubmit={handleReply} className="pt-6 border-t mt-6">
          <h3 className="font-semibold mb-2">Admin Reply</h3>
          <Textarea 
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your reply to the customer here..."
            className="mb-4 min-h-[100px]"
            required
          />
          <Button type="submit" disabled={isReplying}>
            {isReplying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send Reply
          </Button>
        </form>
      )}
    </div>
  );
}
