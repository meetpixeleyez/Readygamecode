import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ ticket: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const ticketId = resolvedParams.ticket;

    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        product: true,
      },
    });

    if (!ticket || (ticket.userId !== session.sub && ticket.sellerId !== session.sub)) {
      return NextResponse.json({ error: "Ticket not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Fetch support ticket detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ ticket: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const ticketId = resolvedParams.ticket;
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket || (ticket.userId !== session.sub && ticket.sellerId !== session.sub)) {
      return NextResponse.json({ error: "Ticket not found or unauthorized" }, { status: 404 });
    }

    // Add message and update ticket status to "Replied" (2)
    const newMessage = await db.$transaction(async (tx) => {
      const msg = await tx.supportMessage.create({
        data: {
          supportTicketId: ticketId,
          message,
          senderId: session.sub,
          isAdmin: false,
        },
      });

      await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: 2, 
          lastReply: new Date(),
        },
      });

      return msg;
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Reply to support ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
