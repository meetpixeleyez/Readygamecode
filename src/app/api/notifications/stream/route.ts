import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addClient } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Add this client to the SSE broadcaster
      const removeClient = addClient(user.sub, controller);
      
      // Remove client when connection drops
      req.signal.addEventListener("abort", () => {
        removeClient();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
