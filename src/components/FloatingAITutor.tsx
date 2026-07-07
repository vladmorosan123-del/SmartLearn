import { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, X, Minus, Send, BookOpen, Loader2,
  FileText, GripHorizontal, Plus, Trash2, MessageSquare,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAITutor } from "@/hooks/useAITutor";
import type { AIMessage } from "@/hooks/useAITutor";
import { useAuthContext } from "@/contexts/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────
let _idCounter = 0;
function uid(): string {
  return `${Date.now()}-${++_idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "acum";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}z`;
}

interface Conversation {
  id: string;
  title: string;
  messages: AIMessage[];
  lastActivity: number;
}

const STORAGE_PREFIX = "smartlearn_ai_conversations";
const THREE_DAYS_MS = 72 * 60 * 60 * 1000;

// Cheie de stocare PER-CONT: fiecare user isi vede doar conversatiile lui.
function storageKey(userKey?: string | null): string {
  return `${STORAGE_PREFIX}_${userKey || "anon"}`;
}

function loadConversations(userKey?: string | null): Conversation[] {
  try {
    const raw = localStorage.getItem(storageKey(userKey));
    if (!raw) return [];
    const all: Conversation[] = JSON.parse(raw);
    if (!Array.isArray(all)) return [];
    return all.filter((c) => c && c.id && Date.now() - c.lastActivity <= THREE_DAYS_MS);
  } catch {
    return [];
  }
}

function saveConversations(convs: Conversation[], userKey?: string | null) {
  try { localStorage.setItem(storageKey(userKey), JSON.stringify(convs)); } catch {}
}

function blankConversation(): Conversation {
  return { id: uid(), title: "Conversație nouă", messages: [], lastActivity: Date.now() };
}

const SUBJECTS = [
  { value: "all", label: "Toate materiile" },
  { value: "matematica", label: "Matematică" },
  { value: "informatica", label: "Informatică" },
  { value: "fizica", label: "Fizică" },
  { value: "romana", label: "Română" },
];

const W0 = 640;
const H0 = 580;

export default function FloatingAITutor() {
  // Contul curent: conversatiile se salveaza separat pentru fiecare user.
  const { user } = useAuthContext();
  const userKey = user?.user_id || user?.id || user?.username || null;
  const keyRef = useRef<string | null>(userKey);
  keyRef.current = userKey;

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [convs, setConvs] = useState<Conversation[]>(() => {
    const loaded = loadConversations(userKey);
    return loaded.length > 0 ? loaded : [blankConversation()];
  });
  const [activeId, setActiveId] = useState<string>(() => {
    const loaded = loadConversations(userKey);
    return loaded.length > 0 ? loaded[0].id : uid();
  });

  const activeConv = convs.find((c) => c.id === activeId) ?? convs[0];
  const { messages, setMessages, loading, subject, setSubject, ask } =
    useAITutor(activeConv?.messages ?? []);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    setConvs((prev) => {
      const next = prev.map((c) =>
        c.id === activeId ? { ...c, messages, lastActivity: Date.now() } : c
      );
      saveConversations(next, keyRef.current);
      return next;
    });
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const first = messages.find((m) => m.role === "user");
    if (!first) return;
    setConvs((prev) =>
      prev.map((c) =>
        c.id === activeId && c.title === "Conversație nouă"
          ? { ...c, title: first.content.slice(0, 45) }
          : c
      )
    );
  }, [messages, activeId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Curata datele vechi PARTAJATE (de dinainte de separarea pe cont) + reincarca la schimbarea contului.
  const loadedKey = useRef<string | null>(userKey);
  useEffect(() => {
    try { localStorage.removeItem(STORAGE_PREFIX); } catch { /* noop */ }
    if (loadedKey.current === userKey) return;
    loadedKey.current = userKey;
    const loaded = loadConversations(userKey);
    const list = loaded.length > 0 ? loaded : [blankConversation()];
    setConvs(list);
    setActiveId(list[0].id);
    mounted.current = false;
    setMessages(list[0].messages);
  }, [userKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchConv = useCallback((id: string) => {
    const conv = convs.find((c) => c.id === id);
    if (!conv) return;
    setActiveId(id);
    mounted.current = false;
    setMessages(conv.messages);
    setInput("");
  }, [convs, setMessages]);

  const newConv = useCallback(() => {
    const conv = blankConversation();
    setConvs((prev) => { const next = [conv, ...prev]; saveConversations(next, keyRef.current); return next; });
    setActiveId(conv.id);
    mounted.current = false;
    setMessages([]);
    setInput("");
  }, [setMessages]);

  const deleteConv = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConvs((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) {
        const fresh = blankConversation();
        saveConversations([fresh], keyRef.current);
        setActiveId(fresh.id);
        mounted.current = false;
        setMessages([]);
        return [fresh];
      }
      saveConversations(next, keyRef.current);
      if (id === activeId) {
        setActiveId(next[0].id);
        mounted.current = false;
        setMessages(next[0].messages);
      }
      return next;
    });
  }, [activeId, setMessages]);

  const handleAsk = useCallback(async () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    await ask(q);
  }, [input, ask]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); }
  };

  const totalAnswers = convs.reduce(
    (n, c) => n + c.messages.filter((m) => m.role === "assistant").length, 0
  );

  const startX = window.innerWidth - W0 - 24;
  const startY = window.innerHeight - H0 - 24;
  const showWidget = open && !minimized;

  const floatingBtn = (
    <button
      type="button"
      onClick={() => { setOpen(true); setMinimized(false); }}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, hsl(220,60%,25%), hsl(220,50%,40%))",
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
      }}
      aria-label="Deschide Tutor AI"
    >
      <Sparkles style={{ width: 24, height: 24, color: "#fde047" }} />
      {totalAnswers > 0 && (
        <span style={{
          position: "absolute",
          top: -4,
          right: -4,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#facc15",
          color: "#1e293b",
          fontSize: 10,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {totalAnswers > 99 ? "99" : totalAnswers}
        </span>
      )}
    </button>
  );

  const widget = (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}>
    <Rnd
      default={{ x: Math.max(0, startX), y: Math.max(0, startY), width: W0, height: H0 }}
      minWidth={380}
      minHeight={360}
      maxWidth={960}
      maxHeight={900}
      bounds="parent"
      cancel=".no-drag, button, textarea, [role='combobox'], [role='listbox'], [role='option']"
      style={{ pointerEvents: "auto" }}
    >
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", borderRadius: 12, border: "1px solid hsl(220,20%,88%)", background: "hsl(220,20%,97%)", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>

        {/* Header */}
        <div
          className="drag-handle"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "linear-gradient(135deg, hsl(220,60%,22%), hsl(220,50%,33%))", cursor: "grab", userSelect: "none", flexShrink: 0 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fef9c3", flex: 1, minWidth: 0 }}>
            <GripHorizontal style={{ width: 16, height: 16, opacity: 0.6 }} />
            <Sparkles style={{ width: 16, height: 16, color: "#fde047" }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Tutor AI</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button type="button" onClick={() => setMinimized(true)} title="Minimizează"
              style={{ padding: 4, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", color: "#fef9c3" }}>
              <Minus style={{ width: 14, height: 14 }} />
            </button>
            <button type="button" onClick={() => setOpen(false)} title="Închide"
              style={{ padding: 4, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", color: "#fef9c3" }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

          {/* Sidebar */}
          <div style={{ width: 164, display: "flex", flexDirection: "column", borderRight: "1px solid hsl(220,20%,88%)", background: "hsl(220,15%,94%)", flexShrink: 0 }}>
            <button type="button" onClick={newConv}
              style={{ margin: "8px 8px 4px", padding: "6px 8px", borderRadius: 6, border: "none", background: "hsl(220,60%,20%)", color: "hsl(45,80%,95%)", fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus style={{ width: 12, height: 12 }} /> Conversație nouă
            </button>
            <div className="no-drag" style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
              {convs.slice().sort((a, b) => b.lastActivity - a.lastActivity).map((conv) => (
                <div key={conv.id} onClick={() => switchConv(conv.id)}
                  style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 6, margin: "0 4px 2px", padding: "6px 8px", borderRadius: 6, cursor: "pointer", background: conv.id === activeId ? "hsla(220,60%,20%,0.12)" : "transparent" }}>
                  <MessageSquare style={{ width: 12, height: 12, marginTop: 2, flexShrink: 0, opacity: 0.5 }} />
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                    <p style={{ fontSize: 11, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", margin: 0 }}>{conv.title}</p>
                    <p style={{ fontSize: 10, opacity: 0.4, margin: "2px 0 0" }}>{relativeTime(conv.lastActivity)}</p>
                  </div>
                  <button type="button" onClick={(e) => deleteConv(conv.id, e)}
                    style={{ position: "absolute", right: 4, top: 6, padding: 2, borderRadius: 3, border: "none", background: "transparent", cursor: "pointer", color: "hsl(0,72%,51%)", opacity: 0 }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                    title="Șterge">
                    <Trash2 style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>

            {/* Messages */}
            <div ref={scrollRef} className="no-drag" style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: 12 }}>
              {messages.length === 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", color: "hsl(220,15%,40%)", gap: 12, padding: "32px 0" }}>
                  <BookOpen style={{ width: 32, height: 32, opacity: 0.4 }} />
                  <p style={{ fontSize: 12, maxWidth: 200, margin: 0 }}>Pune o întrebare despre materialele încărcate pe platformă.</p>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "85%",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                      lineHeight: 1.5,
                      background: msg.role === "user" ? "hsl(220,60%,20%)" : "hsl(220,15%,92%)",
                      color: msg.role === "user" ? "hsl(45,80%,95%)" : "hsl(220,30%,10%)",
                    }}>
                      {msg.role === "user" ? (
                        <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                      ) : (
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p style={{ margin: "0 0 6px" }}>{children}</p>,
                            strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                            ul: ({ children }) => <ul style={{ paddingLeft: 16, margin: "0 0 6px" }}>{children}</ul>,
                            ol: ({ children }) => <ol style={{ paddingLeft: 16, margin: "0 0 6px" }}>{children}</ol>,
                            li: ({ children }) => <li style={{ lineHeight: 1.4 }}>{children}</li>,
                            code: ({ children }) => <code style={{ background: "rgba(0,0,0,0.08)", borderRadius: 3, padding: "1px 4px", fontFamily: "monospace", fontSize: 11 }}>{children}</code>,
                            pre: ({ children }) => <pre style={{ background: "rgba(0,0,0,0.08)", borderRadius: 4, padding: 8, overflowX: "auto", fontSize: 11, margin: "0 0 6px" }}>{children}</pre>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                      {msg.sources && msg.sources.length > 0 && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(0,0,0,0.1)", display: "flex", flexWrap: "wrap", gap: 4 }}>
                          <span style={{ fontSize: 10, opacity: 0.6, display: "flex", alignItems: "center", gap: 4 }}>
                            <FileText style={{ width: 10, height: 10 }} /> Surse:
                          </span>
                          {msg.sources.map((s, j) => (
                            <Badge key={j} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {s.subject || "?"} · {s.category || "material"}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ background: "hsl(220,15%,92%)", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "hsl(220,15%,40%)" }}>
                      <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} /> Formulez răspunsul…
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="no-drag" style={{ borderTop: "1px solid hsl(220,20%,88%)", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6, background: "hsl(220,20%,97%)", flexShrink: 0 }}>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Întreabă… (Enter trimite)"
                  className="resize-none text-xs min-h-[36px] max-h-24"
                  rows={1}
                />
                <button
                  type="button"
                  onClick={handleAsk}
                  disabled={loading || !input.trim()}
                  style={{ width: 36, height: 36, borderRadius: 6, border: "none", background: "hsl(220,60%,35%)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: loading || !input.trim() ? 0.4 : 1 }}
                >
                  {loading ? <Loader2 style={{ width: 14, height: 14 }} /> : <Send style={{ width: 14, height: 14 }} />}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Rnd>
    </div>
  );

  return createPortal(
    <>
      {!showWidget && floatingBtn}
      {showWidget && widget}
    </>,
    document.body
  );
}
