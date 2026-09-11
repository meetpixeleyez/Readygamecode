import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await db.supportTicket.findMany({
      where: { 
        OR: [
          { userId: session.sub },
          { sellerId: session.sub }
        ]
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Fetch support tickets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, priority, message, ticketType, productId, sellerId } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: session.sub } });
    
    // Generate an 8 digit ticket number
    const ticketNumber = Math.floor(10000000 + Math.random() * 90000000).toString();

    // Create the ticket and first message in a transaction
    const ticket = await db.$transaction(async (tx) => {
      const newTicket = await tx.supportTicket.create({
        data: {
          userId: session.sub,
          name: user?.username || "User",
          email: user?.email || "",
          ticket: ticketNumber,
          subject,
          priority: Number(priority) || 2,
          status: 0, // open
          ticketType: ticketType || "ADMIN",
          productId: ticketType === "SELLER" ? productId : null,
          sellerId: ticketType === "SELLER" ? sellerId : null,
        },
      });

      await tx.supportMessage.create({
        data: {
          supportTicketId: newTicket.id,
          message,
          senderId: session.sub,
          isAdmin: false,
        },
      });

      return newTicket;
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Create support ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
