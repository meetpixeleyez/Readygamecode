import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email is required").max(100),
  subject: z.string().min(1, "Subject is required").max(255),
  message: z.string().min(1, "Message is required").max(5000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed.data;
    const session = await getCurrentUser();
    const userId = session?.sub || null;

    // Generate 8-digit ticket number (matches Laravel getNumber format)
    const ticketNumber = Math.floor(10000000 + Math.random() * 90000000).toString();

    // Create support ticket
    const ticket = await db.supportTicket.create({
      data: {
        userId,
        name,
        email,
        ticket: ticketNumber,
        subject,
        status: 0, // OPEN
        priority: 2, // MEDIUM
        lastReply: new Date(),
        adminUnreadCount: 1,
      },
    });

    // Create first message
    await db.supportMessage.create({
      data: {
        supportTicketId: ticket.id,
        message,
      },
    });

    // Create admin notification
    await db.adminNotification.create({
      data: {
        userId,
        title: "A new contact message has been submitted",
        clickUrl: `/admin/ticket/view/${ticket.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      ticketNumber,
      message: "Your message has been received. We'll respond within 24 hours.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
