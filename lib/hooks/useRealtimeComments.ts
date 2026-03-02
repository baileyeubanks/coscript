"use client";

import { useEffect, useState, useCallback } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

interface Comment {
  id: string;
  script_id: string;
  user_id: string | null;
  author_name: string;
  author_email: string | null;
  body: string;
  line_number: number | null;
  status: string;
  parent_id: string | null;
  is_external: boolean;
  created_at: string;
  replies?: Comment[];
}

export function useRealtimeComments(scriptId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!scriptId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/scripts/${scriptId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      // Non-critical
    }
    setLoading(false);
  }, [scriptId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!scriptId) return;

    const supabase = createSupabaseBrowser();
    const channel = supabase
      .channel(`comments:${scriptId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "script_comments", filter: `script_id=eq.${scriptId}` },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scriptId, fetchComments]);

  return { comments, loading, refetch: fetchComments };
}
