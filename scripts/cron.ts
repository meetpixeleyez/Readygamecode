import cron from "node-cron";

console.log("Starting cron scheduler...");

// Run every hour
cron.schedule("0 * * * *", async () => {
  console.log(`[Cron] Executing campaign expiry job at ${new Date().toISOString()}`);
  try {
    const res = await fetch("http://localhost:3000/api/cron", {
      headers: {
        "Authorization": `Bearer ${process.env.CRON_SECRET || 'secret'}`
      }
    });
    const data = await res.json();
    console.log("[Cron] Result:", data);
  } catch (err: any) {
    console.error("[Cron] Failed to execute job:", err.message);
  }
});

console.log("Cron scheduler is active.");
