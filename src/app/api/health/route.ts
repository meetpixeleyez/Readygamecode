import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  let dbStatus = "disconnected";
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const dbStartTime = Date.now();
    // Test database query
    await db.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStartTime;
    dbStatus = "connected";
  } catch (error: any) {
    dbStatus = "error";
    dbError = error?.message || "Failed to query database";
    console.error("Health check database failure:", error);
  }

  const isHealthy = dbStatus === "connected";
  const totalDurationMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp,
      totalDurationMs,
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          ...(dbError ? { error: dbError } : {}),
        },
      },
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
