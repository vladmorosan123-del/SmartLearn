import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

// AI dedicat: foloseste VITE_AI_URL (server AI separat), fallback la VITE_SERVER_URL.
// Astfel widget-ul AI nu comuta aplicatia principala de pe Supabase.
const SERVER_URL = (import.meta.env.VITE_AI_URL || import.meta.env.VITE_SERVER_URL) as string | undefined;

export interface AISource {
  material_id: string;
  subject?: string;
  category?: string;
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
  sources?: AISource[];
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("lm_server_token");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export function useAITutor(initialMessages: AIMessage[] = []) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<AIMessage[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("all");

  const ask = useCallback(
    async (question: string) => {
      if (!question.trim() || loading) return;

      // istoricul conversatiei (ultimele mesaje) pentru memorie multi-tura
      const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));

      setMessages((m) => [...m, { role: "user", content: question }]);
      setLoading(true);

      try {
        const res = await fetch(`${SERVER_URL}/api/ai/ask`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            question,
            subject: subject === "all" ? null : subject,
            history,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Eroare server");

        const reply: AIMessage = {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
        };
        setMessages((m) => [...m, reply]);
        return reply;
      } catch (e: any) {
        toast({
          title: "Eroare",
          description: e.message || "Nu am putut obține răspunsul.",
          variant: "destructive",
        });
        const errMsg: AIMessage = {
          role: "assistant",
          content:
            "Ceva n-a mers. Verifică dacă serverul AI rulează și încearcă din nou.",
        };
        setMessages((m) => [...m, errMsg]);
        return errMsg;
      } finally {
        setLoading(false);
      }
    },
    [loading, subject, toast, messages]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, setMessages, loading, subject, setSubject, ask, clearMessages };
}
