import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ ticket: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
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
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Admin fetch support ticket detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ ticket: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const ticketId = resolvedParams.ticket;
    const body = await req.json();
    const { message, status } = body;

    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Admin can send a message, change status, or both
    const updatedTicket = await db.$transaction(async (tx) => {
      if (message) {
        await tx.supportMessage.create({
          data: {
            supportTicketId: ticketId,
            message,
          },
        });
      }

      const t = await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          ...(status !== undefined && { status: Number(status) }),
          ...(message && { lastReply: new Date() }),
          // If admin replies, usually status becomes "Answered" (1) if it was Open (0) or Replied (2)
          ...(message && status === undefined && { status: 1 }),
        },
      });

      return t;
    });

    return NextResponse.json(updatedTicket, { status: 201 });
  } catch (error) {
    console.error("Admin reply/update support ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
