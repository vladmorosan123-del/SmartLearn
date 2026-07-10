import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Brain, Sparkles, Send, CheckCircle2, Circle,
  BookOpen, Target, TrendingUp, Lightbulb, ClipboardList,
  Calculator, Code, Atom, Globe, BookMarked,
  Zap, Clock, CalendarDays, ListChecks, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const AI_URL = (import.meta.env.VITE_AI_URL || import.meta.env.VITE_SERVER_URL) as string | undefined;

async function askMentor(payload: unknown) {
  const res = await fetch(`${AI_URL}/api/ai/mentor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Serverul mentor nu a raspuns');
  return res.json();
}

// Design-only. Fara logica AI — se va integra ulterior.

type Chapter = { id: string; label: string; done: boolean };

const CHAPTERS_BY_SUBJECT: Record<string, Chapter[]> = {
  matematica: [
    { id: 'm1', label: 'Numere reale și mulțimi', done: false },
    { id: 'm2', label: 'Funcții elementare', done: false },
    { id: 'm3', label: 'Ecuații și inecuații', done: false },
    { id: 'm4', label: 'Trigonometrie', done: false },
    { id: 'm5', label: 'Analiză matematică — Limite', done: false },
    { id: 'm6', label: 'Derivate și aplicații', done: false },
    { id: 'm7', label: 'Integrale', done: false },
  ],
  informatica: [
    { id: 'i1', label: 'Algoritmi elementari', done: false },
    { id: 'i2', label: 'Vectori și matrici', done: false },
    { id: 'i3', label: 'Subprograme (funcții)', done: false },
    { id: 'i4', label: 'Recursivitate', done: false },
    { id: 'i5', label: 'Backtracking', done: false },
    { id: 'i6', label: 'Liste înlănțuite', done: false },
    { id: 'i7', label: 'Arbori și grafuri', done: false },
  ],
  fizica: [
    { id: 'f1', label: 'Mecanică — Cinematică', done: false },
    { id: 'f2', label: 'Mecanică — Dinamică', done: false },
    { id: 'f3', label: 'Termodinamică', done: false },
    { id: 'f4', label: 'Electricitate', done: false },
    { id: 'f5', label: 'Optică', done: false },
  ],
};

type SubjectKey = 'matematica' | 'informatica' | 'fizica' | 'universal';

const SUBJECT_OPTIONS: { key: SubjectKey; label: string; icon: typeof Calculator }[] = [
  { key: 'matematica', label: 'Matematică', icon: Calculator },
  { key: 'informatica', label: 'Informatică', icon: Code },
  { key: 'fizica', label: 'Fizică', icon: Atom },
  { key: 'universal', label: 'Universal', icon: Globe },
];

function getChaptersFor(key: SubjectKey): Chapter[] {
  if (key === 'universal') {
    return [
      ...CHAPTERS_BY_SUBJECT.matematica.map((c) => ({ ...c, id: `mat-${c.id}`, label: `Mate · ${c.label}` })),
      ...CHAPTERS_BY_SUBJECT.informatica.map((c) => ({ ...c, id: `inf-${c.id}`, label: `Info · ${c.label}` })),
      ...CHAPTERS_BY_SUBJECT.fizica.map((c) => ({ ...c, id: `fiz-${c.id}`, label: `Fizică · ${c.label}` })),
    ];
  }
  return CHAPTERS_BY_SUBJECT[key];
}
const SUBJECT_LABEL: Record<Exclude<SubjectKey, 'universal'>, string> = {
  matematica: 'Matematică',
  informatica: 'Informatică',
  fizica: 'Fizică',
};

type SubjectTheme = {
  chipActive: string;
  chipIdle: string;
  tagSoft: string;
  tagText: string;
  itemBg: string;
  border: string;
  dot: string;
  gradient: string;
  ring: string;
};

const SUBJECT_THEME: Record<SubjectKey, SubjectTheme> = {
  matematica: {
    chipActive: 'bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-500/30',
    chipIdle: 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-700 dark:bg-sky-950/40 dark:hover:bg-sky-950/60 dark:border-sky-900 dark:text-sky-300',
    tagSoft: 'bg-sky-100 border-sky-200 dark:bg-sky-950/50 dark:border-sky-900',
    tagText: 'text-sky-700 dark:text-sky-300',
    itemBg: 'bg-sky-50/60 border-sky-200/70 dark:bg-sky-950/30 dark:border-sky-900/60',
    border: 'border-l-sky-400',
    dot: 'bg-sky-500',
    gradient: 'from-sky-500 to-sky-400',
    ring: 'ring-sky-200 dark:ring-sky-900',
  },
  informatica: {
    chipActive: 'bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-500/30',
    chipIdle: 'bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-700 dark:bg-violet-950/40 dark:hover:bg-violet-950/60 dark:border-violet-900 dark:text-violet-300',
    tagSoft: 'bg-violet-100 border-violet-200 dark:bg-violet-950/50 dark:border-violet-900',
    tagText: 'text-violet-700 dark:text-violet-300',
    itemBg: 'bg-violet-50/60 border-violet-200/70 dark:bg-violet-950/30 dark:border-violet-900/60',
    border: 'border-l-violet-400',
    dot: 'bg-violet-500',
    gradient: 'from-violet-500 to-violet-400',
    ring: 'ring-violet-200 dark:ring-violet-900',
  },
  fizica: {
    chipActive: 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/30',
    chipIdle: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 dark:bg-orange-950/40 dark:hover:bg-orange-950/60 dark:border-orange-900 dark:text-orange-300',
    tagSoft: 'bg-orange-100 border-orange-200 dark:bg-orange-950/50 dark:border-orange-900',
    tagText: 'text-orange-700 dark:text-orange-300',
    itemBg: 'bg-orange-50/60 border-orange-200/70 dark:bg-orange-950/30 dark:border-orange-900/60',
    border: 'border-l-orange-400',
    dot: 'bg-orange-500',
    gradient: 'from-orange-500 to-amber-400',
    ring: 'ring-orange-200 dark:ring-orange-900',
  },
  universal: {
    chipActive: 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/30',
    chipIdle: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 dark:border-emerald-900 dark:text-emerald-300',
    tagSoft: 'bg-emerald-100 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-900',
    tagText: 'text-emerald-700 dark:text-emerald-300',
    itemBg: 'bg-emerald-50/60 border-emerald-200/70 dark:bg-emerald-950/30 dark:border-emerald-900/60',
    border: 'border-l-emerald-400',
    dot: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-teal-400',
    ring: 'ring-emerald-200 dark:ring-emerald-900',
  },
};

const CARD_ACCENTS = {
  progress: { icon: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-950/50', gradient: 'from-emerald-500 to-teal-400' },
  chapters: { icon: 'text-sky-500', bg: 'bg-sky-100 dark:bg-sky-950/50', gradient: 'from-sky-500 to-sky-400' },
  strengths: { icon: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-950/50', gradient: 'from-amber-500 to-yellow-400' },
  worklog: { icon: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-950/50', gradient: 'from-rose-500 to-pink-400' },
  exams: { icon: 'text-violet-500', bg: 'bg-violet-100 dark:bg-violet-950/50', gradient: 'from-violet-500 to-fuchsia-400' },
  todo: { icon: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-950/50', gradient: 'from-orange-500 to-amber-400' },
  chat: { icon: 'text-primary', bg: 'bg-primary/10', gradient: 'from-primary to-primary/70' },
} as const;

type Todo = {
  subject: Exclude<SubjectKey, 'universal'>;
  done: boolean;
  title: string;
  hint: string;
  meta: string;
};

const INITIAL_TODOS: Todo[] = [];

type Strength = {
  subject: Exclude<SubjectKey, 'universal'>;
  title: string;
  note: string;
  meta: string;
};

const INITIAL_STRENGTHS: Strength[] = [];

type WorkLogEntry = {
  subject: Exclude<SubjectKey, 'universal'>;
  duration: string;
  what: string;
  date: string;
  ts?: number;
};

const INITIAL_WORK_LOG: WorkLogEntry[] = [];

type ExamEntry = {
  subject: Exclude<SubjectKey, 'universal'>;
  type: 'Test' | 'Simulare' | 'Examen';
  title: string;
  scope: string;
  when: string;
  daysLeft: number;
  plan: string[];
};

const INITIAL_EXAMS: ExamEntry[] = [];



type Recommendation = {
  icon: 'target' | 'book' | 'list';
  type: string;
  title: string;
  reason: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendations?: Recommendation[];
  ts?: number;
};

export default function MentorAI() {
  const navigate = useNavigate();
  const { subject } = useApp();
  const { user } = useAuthContext();

  const initialSubject: SubjectKey =
    subject === 'informatica' || subject === 'fizica' || subject === 'matematica'
      ? (subject as SubjectKey)
      : 'universal';

  const userKey = (user as any)?.user_id || (user as any)?.id || (user as any)?.username || 'anon';
  const storageKey = `smartlearn_mentor_v2_${userKey}`;
  const loadSaved = () => { try { const raw = localStorage.getItem(storageKey); if (raw) return JSON.parse(raw); } catch { /* noop */ } return null; };
  const freshChapters = (key: SubjectKey) => getChaptersFor(key).map((c) => ({ ...c, done: false }));
  const defaultChapters = (): Record<SubjectKey, Chapter[]> => ({
    matematica: freshChapters('matematica'),
    informatica: freshChapters('informatica'),
    fizica: freshChapters('fizica'),
    universal: freshChapters('universal'),
  });

  const [activeSubject, setActiveSubject] = useState<SubjectKey>(initialSubject);
  const [chaptersBySubject, setChaptersBySubject] = useState<Record<SubjectKey, Chapter[]>>(() => loadSaved()?.chaptersBySubject || defaultChapters());
  const chapters = chaptersBySubject[activeSubject];
  const doneChapters = chapters.filter((c) => c.done);

  const displayName =
    (user as any)?.username || (user as any)?.full_name || 'elev';

  const welcomeMsg = (): ChatMessage => ({
    id: 'welcome',
    role: 'assistant',
    content: `Salut, ${displayName}! 👋 Spune-mi ce ai lucrat azi și cum te-ai descurcat. Pe baza a ceea ce îmi spui o să-ți recomand lecții, teste și probleme la care să te concentrezi.`,
  });

  const [todos, setTodos] = useState<Todo[]>(() => loadSaved()?.todos ?? []);
  const [strengths, setStrengths] = useState<Strength[]>(() => loadSaved()?.strengths ?? []);
  const [workLog, setWorkLog] = useState<WorkLogEntry[]>(() => loadSaved()?.workLog ?? []);
  const [exams, setExams] = useState<ExamEntry[]>(() => loadSaved()?.exams ?? []);
  const [loading, setLoading] = useState(false);
  const [messagesBySubject, setMessagesBySubject] = useState<Record<SubjectKey, ChatMessage[]>>(() => {
    const saved = loadSaved()?.messagesBySubject as Record<SubjectKey, ChatMessage[]> | undefined;
    if (saved) return saved;
    return { matematica: [welcomeMsg()], informatica: [welcomeMsg()], fizica: [welcomeMsg()], universal: [welcomeMsg()] };
  });
  const setActiveMessages = (updater: (prev: ChatMessage[]) => ChatMessage[]) =>
    setMessagesBySubject((prev) => ({ ...prev, [activeSubject]: updater(prev[activeSubject]) }));

  // La "universal" combinam mesajele din toate materiile; altfel doar thread-ul materiei active.
  const messages: ChatMessage[] = activeSubject === 'universal'
    ? [
        messagesBySubject.universal[0],
        ...[
          ...messagesBySubject.matematica,
          ...messagesBySubject.informatica,
          ...messagesBySubject.fizica,
          ...messagesBySubject.universal,
        ].filter((m) => m.id !== 'welcome').sort((a, b) => (a.ts || 0) - (b.ts || 0)),
      ]
    : messagesBySubject[activeSubject];

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const uid = (user as any)?.id as string | undefined;
  const dbLoadedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Incarca progresul din baza de date (sincron intre dispozitive)
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('mentor_state')
          .select('data')
          .eq('user_id', uid)
          .maybeSingle();
        if (!cancelled && !error && data?.data) {
          const s = data.data as Record<string, unknown>;
          if (s.chaptersBySubject) setChaptersBySubject(s.chaptersBySubject as Record<SubjectKey, Chapter[]>);
          if (s.todos) setTodos(s.todos as Todo[]);
          if (s.strengths) setStrengths(s.strengths as Strength[]);
          if (s.workLog) setWorkLog(s.workLog as WorkLogEntry[]);
          if (s.exams) setExams(s.exams as ExamEntry[]);
          if (s.messagesBySubject) setMessagesBySubject(s.messagesBySubject as Record<SubjectKey, ChatMessage[]>);
        }
      } catch { /* tabelul poate lipsi inca — ramanem pe localStorage */ }
      finally { if (!cancelled) dbLoadedRef.current = true; }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  // Persistenta pe cont — localStorage instant + sincronizare in baza de date (debounce)
  useEffect(() => {
    const payload = { chaptersBySubject, todos, strengths, workLog, exams, messagesBySubject };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch { /* noop */ }
    if (uid && dbLoadedRef.current) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        (supabase as any)
          .from('mentor_state')
          .upsert({ user_id: uid, data: payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
          .then(() => {}, () => {});
      }, 800);
    }
  }, [storageKey, chaptersBySubject, todos, strengths, workLog, exams, messagesBySubject, uid]);

  const toggleChapter = (id: string) => {
    setChaptersBySubject((prev) => ({
      ...prev,
      [activeSubject]: prev[activeSubject].map((c) =>
        c.id === id ? { ...c, done: !c.done } : c
      ),
    }));
  };

  // Aplica modificarile venite de la mentor pe board-uri
  const applyActions = (actions: any) => {
    if (!actions) return;
    const subj = (activeSubject === 'universal' ? 'matematica' : activeSubject) as Exclude<SubjectKey, 'universal'>;

    const done = new Set((actions.chaptersDone || []).map(String));
    const undone = new Set((actions.chaptersUndone || []).map(String));
    if (done.size || undone.size) {
      setChaptersBySubject((prev) => {
        const next = { ...prev };
        (Object.keys(next) as SubjectKey[]).forEach((key) => {
          next[key] = next[key].map((c) =>
            done.has(c.id) ? { ...c, done: true } : undone.has(c.id) ? { ...c, done: false } : c
          );
        });
        return next;
      });
    }

    const doneTitles: string[] = (actions.todosDone || []).map((s: string) => String(s).toLowerCase());
    if (doneTitles.length) {
      setTodos((prev) => prev.map((t) =>
        doneTitles.some((d) => t.title.toLowerCase().includes(d) || d.includes(t.title.toLowerCase()))
          ? { ...t, done: true } : t
      ));
    }
    if (Array.isArray(actions.todosAdd) && actions.todosAdd.length) {
      const added: Todo[] = actions.todosAdd.map((t: any) => ({
        subject: subj, done: false, title: t.title || 'De lucrat', hint: t.hint || '', meta: 'adăugat de mentor · azi',
      }));
      setTodos((prev) => [...added, ...prev]);
    }
    if (Array.isArray(actions.strengthsAdd) && actions.strengthsAdd.length) {
      const added: Strength[] = actions.strengthsAdd.map((s: any) => ({
        subject: subj, title: s.title || '', note: s.note || '', meta: 'azi',
      }));
      setStrengths((prev) => [...added, ...prev]);
    }
    if (actions.workLogAdd && actions.workLogAdd.what) {
      setWorkLog((prev) => [
        { subject: subj, duration: actions.workLogAdd.duration || '—', what: actions.workLogAdd.what, date: 'azi', ts: Date.now() },
        ...prev,
      ]);
    }
    if (Array.isArray(actions.examsAdd) && actions.examsAdd.length) {
      const added: ExamEntry[] = actions.examsAdd.map((e: any) => ({
        subject: subj,
        type: (['Test', 'Simulare', 'Examen'].includes(e.type) ? e.type : 'Test') as ExamEntry['type'],
        title: e.title || 'Examen',
        scope: e.scope || '',
        when: e.when || '',
        daysLeft: Number(e.daysLeft) || 0,
        plan: Array.isArray(e.plan) ? e.plan : [],
      }));
      setExams((prev) => [...added, ...prev]);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
    setActiveMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', content: text, ts: Date.now() }]);
    setInput('');
    setLoading(true);
    try {
      const data = await askMentor({
        message: text,
        subject: activeSubject,
        history,
        state: { chapters: chaptersBySubject[activeSubject], todos },
      });
      const recs: Recommendation[] = (data.recommendations || []).map((r: any) => ({
        icon: /test/i.test(r.type || '') ? 'list' : /problem/i.test(r.type || '') ? 'target' : 'book',
        type: r.type || 'Recomandare',
        title: r.title || '',
        reason: r.reason || '',
      }));
      setActiveMessages((m) => [...m, {
        id: `a-${Date.now()}`, role: 'assistant', ts: Date.now(),
        content: data.reply || 'Am notat.',
        recommendations: recs.length ? recs : undefined,
      }]);
      applyActions(data.actions);
    } catch (e) {
      setActiveMessages((m) => [...m, {
        id: `e-${Date.now()}`, role: 'assistant', ts: Date.now(),
        content: 'Nu am putut ajunge la mentor acum. Verifică conexiunea și încearcă din nou.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const doneCount = doneChapters.length;
  const progress = chapters.length ? Math.round((doneCount / chapters.length) * 100) : 0;

  // Statistici calculate din date reale (nu hardcodate)
  const parseMin = (dur: string) => {
    const h = /(\d+)\s*h/.exec(dur || '');
    const m = /(\d+)\s*m/.exec(dur || '');
    return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
  };
  const now = Date.now();
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
  const weekMinutes = workLog.reduce(
    (acc, w) => acc + (!w.ts || now - w.ts <= WEEK_MS ? parseMin(w.duration) : 0),
    0,
  );
  const hoursLabel = `${Math.floor(weekMinutes / 60)}h ${weekMinutes % 60}m`;
  const activeDays = new Set(workLog.map((w) => (w.ts ? dayKey(w.ts) : w.date))).size;
  const sessionCount = workLog.length;
  // Serie de zile consecutive cu activitate (pe baza ts-urilor)
  const streak = (() => {
    const days = new Set(workLog.filter((w) => w.ts).map((w) => dayKey(w.ts as number)));
    if (!days.size) return 0;
    const d = new Date();
    if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
    let s = 0;
    while (days.has(dayKey(d.getTime()))) {
      s += 1;
      d.setDate(d.getDate() - 1);
    }
    return s;
  })();

  const theme = SUBJECT_THEME[activeSubject];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50/40 via-background to-violet-50/40 dark:from-sky-950/20 dark:via-background dark:to-violet-950/20">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            aria-label="Înapoi"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${theme.gradient} flex items-center justify-center shrink-0 shadow-md transition-all`}>
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold truncate">Mentor AI</h1>
              <p className="text-xs text-muted-foreground truncate">
                Profesorul tău personal — îți urmărește progresul și te ghidează spre BAC și examene
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Activ
          </Badge>
        </div>
      </div>

      {/* Subject selector */}
      <div className="border-b bg-card/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mr-2 shrink-0">
            Materie:
          </span>
          {SUBJECT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = activeSubject === opt.key;
            const t = SUBJECT_THEME[opt.key];
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setActiveSubject(opt.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all shrink-0 ${
                  active ? t.chipActive : t.chipIdle
                }`}
              >
                <Icon className="w-4 h-4" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>



      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Chat */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col h-[calc(100vh-13rem)] min-h-[500px] overflow-hidden border-t-2 border-t-primary/60 shadow-sm">
            {/* Chat header */}
            <div className="px-5 py-3 border-b flex items-center gap-2.5 shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
              <div className={`w-7 h-7 rounded-md ${CARD_ACCENTS.chat.bg} flex items-center justify-center`}>
                <Brain className={`w-4 h-4 ${CARD_ACCENTS.chat.icon}`} />
              </div>
              <h3 className="font-semibold text-sm">Chat cu mentorul</h3>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>

            {/* Input */}
            <div className="border-t p-3 shrink-0">
              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Scrie ce ai lucrat, unde te-ai blocat, ce ți-a ieșit..."
                  rows={2}
                  disabled={loading}
                  className="resize-none flex-1"
                />
                <Button onClick={handleSend} disabled={!input.trim() || loading} size="icon" className="shrink-0 h-10 w-10">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Enter pentru trimitere · Shift+Enter pentru rând nou. Datele se salvează pe contul tău.
              </p>
            </div>
          </Card>

          {/* De lucrat — memorie AI actualizabila */}
          <Card className="p-5 mt-6 border-t-2 border-t-orange-400 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${CARD_ACCENTS.todo.bg} flex items-center justify-center`}>
                  <Target className={`w-4 h-4 ${CARD_ACCENTS.todo.icon}`} />
                </div>
                <h3 className="font-semibold">De lucrat</h3>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Actualizat de mentor
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Lista se actualizează pe baza conversației. Când îi spui că ai
              rezolvat ceva, mentorul bifează. Când te blochezi la ceva nou,
              adaugă în listă.
            </p>

            <ul className="space-y-2">
              {todos.filter(
                (t) => activeSubject === 'universal' || t.subject === activeSubject
              ).map((t, i) => (
                <TodoItem
                  key={i}
                  done={t.done}
                  title={t.title}
                  hint={t.hint}
                  meta={t.meta}
                  subject={t.subject}
                />
              ))}
              {todos.filter(
                (t) => activeSubject === 'universal' || t.subject === activeSubject
              ).length === 0 && (
                <li className="text-xs text-muted-foreground text-center py-6">
                  Nimic în listă la această materie. Spune-i mentorului ce ai
                  lucrat ca să te ghideze.
                </li>
              )}
            </ul>

            <div className="mt-4 pt-4 border-t border-dashed flex items-start gap-2 text-[11px] text-muted-foreground">
              <Lightbulb className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
              <span>
                Nu edita manual — spune-i mentorului în chat ce ai rezolvat sau
                unde te-ai blocat și lista se schimbă singură.
              </span>
            </div>
          </Card>

          {/* Examene / teste / simulări — mini plan generat de AI */}
          <Card className="p-5 border-t-2 border-t-violet-400 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${CARD_ACCENTS.exams.bg} flex items-center justify-center`}>
                  <CalendarDays className={`w-4 h-4 ${CARD_ACCENTS.exams.icon}`} />
                </div>
                <h3 className="font-semibold">Ce urmează</h3>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Plan de mentor
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Spune-i mentorului dacă ai un test, o simulare sau un examen și
              din ce dă. Îți face automat un mic plan de lecții până atunci.
            </p>

            <ul className="space-y-3">
              {exams.filter(
                (e) => activeSubject === 'universal' || e.subject === activeSubject
              ).map((e, i) => {
                const et = SUBJECT_THEME[e.subject];
                return (
                <li key={i} className={`p-3 rounded-lg border border-l-4 ${et.border} ${et.itemBg}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wide ${et.tagSoft} ${et.tagText}`}>
                      {e.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {e.when} · {e.daysLeft} zile
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-snug">{e.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {SUBJECT_LABEL[e.subject]} · din: {e.scope}
                  </p>

                  <div className="mt-2.5 pt-2.5 border-t border-dashed">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <ListChecks className={`w-3 h-3 ${et.tagText}`} />
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Mini plan
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {e.plan.map((p, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${et.dot}`} />
                          <span className="leading-snug">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
                );
              })}
              {exams.filter(
                (e) => activeSubject === 'universal' || e.subject === activeSubject
              ).length === 0 && (
                <li className="text-xs text-muted-foreground text-center py-6">
                  Niciun test programat aici. Spune-i mentorului când ai
                  următorul examen și îți construiește planul.
                </li>
              )}
            </ul>
          </Card>
        </div>

        {/* RIGHT — Progres */}
        <div className="space-y-6">
          {/* Progres global */}
          <Card className="p-5 border-t-2 border-t-emerald-400 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className={`w-8 h-8 rounded-lg ${CARD_ACCENTS.progress.bg} flex items-center justify-center`}>
                <TrendingUp className={`w-4 h-4 ${CARD_ACCENTS.progress.icon}`} />
              </div>
              <h3 className="font-semibold">Progresul tău</h3>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">{progress}%</span>
                <span className="text-xs text-muted-foreground">
                  {doneCount} / {chapters.length} capitole
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${CARD_ACCENTS.progress.gradient} transition-all`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniStat label="Sesiuni" value={String(sessionCount)} tint="sky" />
              <MiniStat label="Teste" value={String(exams.length)} tint="violet" />
              <MiniStat label="Zile activ" value={String(activeDays)} tint="emerald" />
            </div>
          </Card>

          {/* Checklist capitole */}
          <Card className="p-5 border-t-2 border-t-sky-400 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className={`w-8 h-8 rounded-lg ${CARD_ACCENTS.chapters.bg} flex items-center justify-center`}>
                <ClipboardList className={`w-4 h-4 ${CARD_ACCENTS.chapters.icon}`} />
              </div>
              <h3 className="font-semibold">Capitole parcurse</h3>
            </div>

            <ul className="space-y-1">
              {chapters.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggleChapter(c.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-md text-left hover:bg-muted transition-colors"
                  >
                    {c.done ? (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        c.done
                          ? 'text-muted-foreground line-through'
                          : 'text-foreground'
                      }`}
                    >
                      {c.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Puncte forte — observate de AI */}
          <Card className="p-5 border-t-2 border-t-amber-400 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${CARD_ACCENTS.strengths.bg} flex items-center justify-center`}>
                  <Zap className={`w-4 h-4 ${CARD_ACCENTS.strengths.icon}`} />
                </div>
                <h3 className="font-semibold">Puncte forte</h3>
              </div>
              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300">
                Constatat de AI
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Ce ți-a ieșit bine, pe baza conversațiilor tale cu mentorul.
            </p>

            <ul className="space-y-2">
              {strengths.filter(
                (s) => activeSubject === 'universal' || s.subject === activeSubject
              ).map((s, i) => {
                const st = SUBJECT_THEME[s.subject];
                return (
                <li
                  key={i}
                  className={`p-3 rounded-lg border border-l-4 ${st.border} ${st.itemBg}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-[10px] font-medium uppercase tracking-wide ${st.tagText}`}>
                      {SUBJECT_LABEL[s.subject]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{s.meta}</span>
                  </div>
                  <p className="text-sm font-medium leading-snug">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {s.note}
                  </p>
                </li>
                );
              })}
              {strengths.filter(
                (s) => activeSubject === 'universal' || s.subject === activeSubject
              ).length === 0 && (
                <li className="text-xs text-muted-foreground text-center py-6">
                  Încă nimic notat la această materie. Continuă să vorbești cu
                  mentorul ca să identifice punctele tale forte.
                </li>
              )}
            </ul>
          </Card>

          {/* Jurnal — cât și ce ai lucrat */}
          <Card className="p-5 border-t-2 border-t-rose-400 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${CARD_ACCENTS.worklog.bg} flex items-center justify-center`}>
                  <Clock className={`w-4 h-4 ${CARD_ACCENTS.worklog.icon}`} />
                </div>
                <h3 className="font-semibold">Cât ai lucrat</h3>
              </div>
              <Badge variant="outline" className="text-[10px] border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300">
                Din spusele tale
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <MiniStat label="Ore săptămâna asta" value={hoursLabel} tint="rose" />
              <MiniStat label="Serie zile la rând" value={String(streak)} tint="orange" />
            </div>

            <ul className="space-y-2">
              {workLog.filter(
                (w) => activeSubject === 'universal' || w.subject === activeSubject
              ).map((w, i) => {
                const wt = SUBJECT_THEME[w.subject];
                return (
                <li key={i} className={`p-2.5 rounded-md border border-l-4 ${wt.border} ${wt.itemBg}`}>
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`text-[10px] font-medium uppercase tracking-wide ${wt.tagText}`}>
                      {SUBJECT_LABEL[w.subject]} · {w.duration}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{w.date}</span>
                  </div>
                  <p className="text-xs leading-snug">{w.what}</p>
                </li>
                );
              })}
              {workLog.filter(
                (w) => activeSubject === 'universal' || w.subject === activeSubject
              ).length === 0 && (
                <li className="text-xs text-muted-foreground text-center py-4">
                  Nicio sesiune înregistrată la această materie.
                </li>
              )}
            </ul>

            <div className="mt-3 pt-3 border-t border-dashed flex items-start gap-2 text-[11px] text-muted-foreground">
              <Lightbulb className="w-3 h-3 mt-0.5 shrink-0 text-amber-500" />
              <span>
                Spune-i în chat cât ai lucrat și la ce — mentorul optimizează
                jurnalul automat.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-muted' : 'bg-primary/10'
        }`}
      >
        {isUser ? (
          <span className="text-xs font-semibold">Tu</span>
        ) : (
          <Brain className="w-4 h-4 text-primary" />
        )}
      </div>
      <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`inline-block max-w-full px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted rounded-tl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {message.recommendations && message.recommendations.length > 0 && (
          <div className="mt-3 w-full space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Lightbulb className="w-3.5 h-3.5 text-primary" />
              Recomandări
            </div>
            {message.recommendations.map((r, i) => (
              <RecommendationRow key={i} rec={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationRow({ rec }: { rec: Recommendation }) {
  const Icon =
    rec.icon === 'target' ? Target : rec.icon === 'book' ? BookOpen : ClipboardList;
  return (
    <div className="flex gap-3 p-3 rounded-lg border bg-background hover:bg-muted/40 transition-colors cursor-pointer">
      <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {rec.type}
        </p>
        <p className="text-sm font-medium truncate">{rec.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
      </div>
    </div>
  );
}

function MemoryItem({
  tag,
  tone,
  text,
  meta,
}: {
  tag: string;
  tone: 'good' | 'warn' | 'info';
  text: string;
  meta: string;
}) {
  const toneClasses =
    tone === 'good'
      ? 'bg-primary/10 text-primary border-primary/20'
      : tone === 'warn'
      ? 'bg-destructive/10 text-destructive border-destructive/20'
      : 'bg-muted text-foreground border-border';
  return (
    <li className="p-3 rounded-lg border bg-muted/20">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${toneClasses}`}>
          {tag}
        </span>
        <span className="text-[10px] text-muted-foreground">{meta}</span>
      </div>
      <p className="text-xs leading-relaxed">{text}</p>
    </li>
  );
}

const MINI_STAT_TINTS = {
  sky: 'bg-sky-100/70 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  violet: 'bg-violet-100/70 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  emerald: 'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  orange: 'bg-orange-100/70 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  rose: 'bg-rose-100/70 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  muted: 'bg-muted/50 text-foreground',
} as const;

function MiniStat({ label, value, tint = 'muted' }: { label: string; value: string; tint?: keyof typeof MINI_STAT_TINTS }) {
  return (
    <div className={`p-2 rounded-md ${MINI_STAT_TINTS[tint]}`}>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide opacity-70">
        {label}
      </div>
    </div>
  );
}

function TodoItem({
  done,
  title,
  hint,
  meta,
  subject,
}: {
  done: boolean;
  title: string;
  hint: string;
  meta: string;
  subject: Exclude<SubjectKey, 'universal'>;
}) {
  const t = SUBJECT_THEME[subject];
  return (
    <li
      className={`p-3 rounded-lg border border-l-4 flex gap-3 ${t.border} ${
        done ? 'bg-muted/20 opacity-70' : t.itemBg
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {done ? (
          <CheckCircle2 className={`w-4 h-4 ${t.tagText}`} />
        ) : (
          <Circle className={`w-4 h-4 ${t.tagText} opacity-60`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium leading-snug ${
            done ? 'line-through text-muted-foreground' : 'text-foreground'
          }`}
        >
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {hint}
        </p>
        <p className="text-[10px] text-muted-foreground/80 mt-1.5 uppercase tracking-wide">
          {meta}
        </p>
      </div>
    </li>
  );
}
