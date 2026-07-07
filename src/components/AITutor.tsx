import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, BookOpen, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAITutor } from "@/hooks/useAITutor";
import type { AIMessage } from "@/hooks/useAITutor";

const SUBJECTS = [
  { value: "all", label: "Toate materiile" },
  { value: "matematica", label: "Matematică" },
  { value: "informatica", label: "Informatică" },
  { value: "fizica", label: "Fizică" },
  { value: "romana", label: "Română" },
];

export default function AITutor() {
  const { messages, loading, subject, setSubject, ask } = useAITutor();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleAsk = async () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    await ask(q);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto border-2 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-[hsl(220,60%,20%)] to-[hsl(220,50%,30%)] text-[hsl(45,80%,95%)] rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-[hsl(45,80%,60%)]" />
          Tutor AI — întreabă din materialele tale
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[420px] px-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3 py-12">
              <BookOpen className="h-10 w-10 opacity-40" />
              <p className="max-w-sm text-sm">
                Pune o întrebare despre lecții, exerciții sau noțiuni. Răspund
                doar pe baza materialelor încărcate pe platformă.
              </p>
            </div>
          )}
          <div className="space-y-4">
            {messages.map((msg: AIMessage, i: number) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.role === "user" ? (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  ) : (
                    <ReactMarkdown
                      className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                      components={{
                        p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                        ul: ({children}) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                        li: ({children}) => <li>{children}</li>,
                        code: ({children}) => <code className="bg-black/10 rounded px-1 font-mono text-xs">{children}</code>,
                        pre: ({children}) => <pre className="bg-black/10 rounded p-2 overflow-x-auto text-xs mb-2">{children}</pre>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap gap-1.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Surse:
                      </span>
                      {msg.sources.map((s, j) => (
                        <Badge key={j} variant="secondary" className="text-xs">
                          {s.subject || "?"} · {s.category || "material"}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Caut în materiale și formulez răspunsul…
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-3 space-y-2 bg-background">
          <div className="flex items-center gap-2">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Scrie întrebarea ta… (Enter pentru trimitere)"
              className="resize-none min-h-[44px] max-h-32"
              rows={1}
            />
            <Button
              onClick={handleAsk}
              disabled={loading || !input.trim()}
              variant="navy"
              size="icon"
              className="h-11 w-11 shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
