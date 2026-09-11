type Client = {
  id: string;
  userId: string;
  controller: ReadableStreamDefaultController;
};

// Use a global variable to persist clients across hot reloads in development
const globalForSse = globalThis as unknown as {
  sseClients: Set<Client>;
};

export const sseClients = globalForSse.sseClients || new Set<Client>();

if (process.env.NODE_ENV !== "production") {
  globalForSse.sseClients = sseClients;
}

export function addClient(userId: string, controller: ReadableStreamDefaultController) {
  const client: Client = {
    id: Math.random().toString(36).substring(7),
    userId,
    controller,
  };
  sseClients.add(client);
  
  // Send initial connected event
  try {
    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
  } catch (e) {
    console.error("Error sending initial SSE:", e);
  }

  return () => {
    sseClients.delete(client);
  };
}

export function broadcastNotification(userId?: string, eventType: string = 'notification_update') {
  const encoder = new TextEncoder();
  const data = `data: ${JSON.stringify({ type: eventType })}\n\n`;
  
  for (const client of Array.from(sseClients)) {
    if (!userId || userId === "all" || userId === "admin" || client.userId === userId) {
      try {
        client.controller.enqueue(encoder.encode(data));
      } catch (e) {
        sseClients.delete(client);
      }
    }
  }
}
