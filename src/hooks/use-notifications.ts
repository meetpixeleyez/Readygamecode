"use client";

import { useState, useEffect, useCallback } from "react";

export type NotificationCounts = {
  seller: { refunds: number; support: number; total: number };
  buyer: { refunds: number; support: number; total: number };
  admin: { refunds: number; support: number; pendingProducts: number; withdrawals: number; total: number };
};

const defaultCounts: NotificationCounts = {
  seller: { refunds: 0, support: 0, total: 0 },
  buyer: { refunds: 0, support: 0, total: 0 },
  admin: { refunds: 0, support: 0, pendingProducts: 0, withdrawals: 0, total: 0 },
};

export function useNotifications() {
  const [counts, setCounts] = useState<NotificationCounts>(defaultCounts);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
      }
    } catch (e) {
      console.error("Failed to fetch notification counts", e);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchCounts();

    // Listen to SSE
    const eventSource = new EventSource("/api/notifications/stream");
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "notification_update") {
        fetchCounts();
      }
    };

    return () => {
      eventSource.close();
    };
  }, [fetchCounts]);

  return counts;
}
