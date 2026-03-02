"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

interface PresenceUser {
  user_id: string;
  email: string;
  color: string;
}

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export function useRealtimePresence(scriptId: string | null) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!scriptId) return;

    const supabase = createSupabaseBrowser();
    const channel = supabase.channel(`presence:${scriptId}`);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const present: PresenceUser[] = [];
        const seen = new Set<string>();
        Object.values(state).forEach((presences) => {
          (presences as unknown as PresenceUser[]).forEach((p) => {
            if (!seen.has(p.user_id)) {
              seen.add(p.user_id);
              present.push(p);
            }
          });
        });
        setUsers(present);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const color = COLORS[Math.abs(user.id.charCodeAt(0)) % COLORS.length];
            channel.track({
              user_id: user.id,
              email: user.email || "Unknown",
              color,
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scriptId]);

  return users;
}
