import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Link2, Loader2, FileText, Eye, Send, Download, ShieldAlert, CheckCircle2,
  FolderOpen, ChevronRight, ChevronLeft, Search, SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';

// HIBRID: serverul gazduit merge pentru majoritatea surselor, dar unele (subiecte.edu.ro, pbinfo)
// blocheaza IP-urile de datacenter -> cadem pe serverul local al profesorului (IP rezidential).
const HOSTED_URL = (import.meta.env.VITE_IMPORT_URL as string) || 'https://smartlearn-import-7i03.onrender.com';
const LOCAL_URL = 'http://localhost:3040';
// Bazele de incercat, in ordine (fara duplicat daca gazduitul e chiar localhost, ex. in dev).
const IMPORT_BASES = Array.from(new Set([HOSTED_URL, LOCAL_URL]));
// Semnatura unei surse pe care serverul N-A putut-o citi (blocaj) -> merita reincercat pe alt server.
const SOURCE_BLOCKED = /fetch failed|->\s*[45]\d\d|timeout|connect|sursa nu r|n-am putut (citi|extrage)|nu am g[ăa]sit fi[șs]iere/i;

// Trimite o cerere de CITIRE (filter/chat/list) incercand serverele in ordine; cade pe urmatorul
// daca sursa e blocata pe cel gazduit. Intoarce si `base` (serverul care a reusit) pt publicare/preview.
async function importPost(path: string, body: unknown): Promise<{ data: any; base: string }> {
  let lastErr: unknown;
  for (let i = 0; i < IMPORT_BASES.length; i++) {
    const base = IMPORT_BASES[i];
    const isLast = i === IMPORT_BASES.length - 1;
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      const blocked = !res.ok || (data && data.error && SOURCE_BLOCKED.test(String(data.error)));
      if (blocked && !isLast) { lastErr = new Error((data && data.error) || `server ${res.status}`); continue; }
      return { data, base };
    } catch (e) {
      lastErr = e; // server inaccesibil -> incearca urmatorul
      if (isLast) throw lastErr;
    }
  }
  throw lastErr;
}

const EXAMPLE_URL = 'https://subiecte.edu.ro/2026/bacalaureat/modeledesubiecte/probescrise/';

// Configul barei: fiecare materie are alte specializari; limbajul apare doar la informatica.
const SUBJECTS = [
  { slug: 'matematica', label: 'Matematică', spec: ['mate-info', 'st-nat', 'tehnologic', 'pedagogic'], lang: false },
  { slug: 'informatica', label: 'Informatică', spec: ['mate-info', 'st-nat'], lang: true },
  { slug: 'fizica', label: 'Fizică', spec: ['real', 'tehnologic'], lang: false },
  { slug: 'romana', label: 'Română', spec: ['real', 'uman'], lang: false },
] as const;
const SPEC_LABEL: Record<string, string> = { 'mate-info': 'Mate-Info', 'st-nat': 'Șt. naturii', real: 'Real', uman: 'Uman', tehnologic: 'Tehnologic', pedagogic: 'Pedagogic' };
const YEARS = ['', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019'];
const TIPS = [{ v: 'ambele', l: 'Subiect + barem' }, { v: 'subiecte', l: 'Doar subiecte' }, { v: 'bareme', l: 'Doar bareme' }];
// Sectiunea din platforma (campul genre) — trebuie sa fie EXACT ca in Modele BAC.
const SECTIONS = [
  { v: 'Variante întregi', l: 'Variantă întreagă' },
  { v: 'Subiectul I', l: 'Subiectul I' },
  { v: 'Subiectul II', l: 'Subiectul II' },
  { v: 'Subiectul III', l: 'Subiectul III' },
];

type Material = { title: string; file_name: string; tip: string; profil: string | null; year: number | null; subject?: string; category?: string; previewUrl: string };
type Msg = { role: 'user' | 'assistant'; content: string; materials?: Material[]; session?: string; base?: string };

export default function ImportSubiecte() {
  const navigate = useNavigate();
  const { role, session: authSession } = useAuthContext();
  const isProf = role === 'profesor' || role === 'admin';

  const [url, setUrl] = useState(EXAMPLE_URL);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Alege materia și filtrele de sus, apoi apasă „Adu subiectele". Pentru o cerere specială (ex: „doar variantele 1–5"), scrie jos în chat.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [sel, setSel] = useState<Record<string, string[]>>({}); // session -> file_name[] bifate
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Bara de filtre (calea principala, fara AI) ──
  const [subject, setSubject] = useState('informatica');
  const [year, setYear] = useState('');
  const [specializare, setSpecializare] = useState<string | null>(null);
  const [limbaj, setLimbaj] = useState<string | null>(null);
  const [tip, setTip] = useState('ambele');
  const [section, setSection] = useState('Variante întregi'); // genre in platforma
  const subjCfg = SUBJECTS.find((s) => s.slug === subject) || SUBJECTS[0];

  const pickSubject = (slug: string) => { setSubject(slug); setSpecializare(null); setLimbaj(null); };

  const runFilter = async () => {
    if (loading) return;
    const effUrl = url.trim();
    if (!effUrl) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Lipește sus un link oficial cu subiecte, apoi apasă „Adu subiectele".' }]);
      return;
    }
    const desc = [
      subjCfg.label,
      year || 'toți anii',
      specializare ? SPEC_LABEL[specializare] : null,
      limbaj === 'c' ? 'C/C++' : limbaj === 'pascal' ? 'Pascal' : null,
      tip === 'subiecte' ? 'doar subiecte' : tip === 'bareme' ? 'doar bareme' : null,
    ].filter(Boolean).join(' · ');
    setMessages((m) => [...m, { role: 'user', content: `Filtru: ${desc}` }]);
    setLoading(true);
    try {
      const { data, base } = await importPost('/api/import/filter', {
        url: effUrl, subject,
        year: year || undefined,
        specializare: specializare || undefined,
        limbaj: limbaj || undefined,
        tip,
      });
      if (data.error && !(data.materials || []).length) throw new Error(data.error);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply, materials: data.materials, session: data.session, base }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${e instanceof Error ? e.message : 'Eroare'}. Dacă e o sursă oficială (subiecte.edu.ro/pbinfo), pornește serverul local — doar el o poate citi.` }]);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (session: string, fname: string, allNames: string[]) =>
    setSel((s) => {
      const cur = s[session] ?? allNames;
      const next = cur.includes(fname) ? cur.filter((x) => x !== fname) : [...cur, fname];
      return { ...s, [session]: next };
    });

  // ── Răsfoire manuală (escape hatch pentru pagini neobișnuite) ──
  type BrowseItem = { id: string; label: string; kind: string; href: string | null; tip?: string; profil?: string | null; year?: number | null; title?: string };
  const [browseMode, setBrowseMode] = useState(false);
  const [browseUrl, setBrowseUrl] = useState('');
  const [browseStack, setBrowseStack] = useState<{ url: string; label: string }[]>([]);
  const [browseItems, setBrowseItems] = useState<BrowseItem[]>([]);
  const [browseChecked, setBrowseChecked] = useState<Set<string>>(new Set());
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseImporting, setBrowseImporting] = useState(false);
  const [browseInfo, setBrowseInfo] = useState<string | null>(null);
  const [browseBase, setBrowseBase] = useState(HOSTED_URL); // serverul care a listat pagina (pt import)

  const listUrl = async (u: string) => {
    setBrowseLoading(true);
    setBrowseChecked(new Set());
    setBrowseInfo(null);
    try {
      const { data, base } = await importPost('/api/import/list', { url: u });
      setBrowseBase(base);
      setBrowseItems(data.items || []);
      if (data.error) setBrowseInfo(`⚠️ ${data.error}`);
      else if (!(data.items || []).length) setBrowseInfo('Nimic de descărcat aici.');
    } catch {
      setBrowseInfo('⚠️ Nu am putut citi pagina (nici găzduit, nici local). Dacă e sursă oficială, pornește serverul local.');
      setBrowseItems([]);
    } finally {
      setBrowseLoading(false);
    }
  };

  const openBrowse = () => {
    if (!url.trim()) return;
    setBrowseMode(true);
    setBrowseStack([]);
    setBrowseUrl(url.trim());
    listUrl(url.trim());
  };
  const drillIn = (it: BrowseItem) => {
    if (!it.href) return;
    setBrowseStack((s) => [...s, { url: browseUrl, label: it.label }]);
    setBrowseUrl(it.href);
    listUrl(it.href);
  };
  const goBack = () => {
    setBrowseStack((s) => {
      const st = [...s];
      const prev = st.pop();
      if (prev) { setBrowseUrl(prev.url); listUrl(prev.url); }
      return st;
    });
  };
  const toggleCheck = (id: string) =>
    setBrowseChecked((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const doBrowseImport = async () => {
    if (!browseChecked.size || browseImporting) return;
    const ok = window.confirm(`Sigur vrei să publici ${browseChecked.size} fișiere pe platformă?\n\nElevii le vor vedea imediat.`);
    if (!ok) return;
    setBrowseImporting(true);
    setBrowseInfo(null);
    try {
      const res = await fetch(`${browseBase}/api/import/browse-import`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: browseUrl, ids: [...browseChecked], genre: section, token: (authSession as { access_token?: string } | null)?.access_token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Eroare la import');
      setBrowseInfo(`✅ Am importat ${data.imported} materiale. Sunt vizibile la elevi.`);
      setBrowseChecked(new Set());
    } catch (e) {
      setBrowseInfo(`⚠️ ${e instanceof Error ? e.message : 'Import eșuat'}`);
    } finally {
      setBrowseImporting(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Dacă lipești un link în chat, îl folosesc ca pagină de căutat.
    const urlInMsg = text.match(/https?:\/\/[^\s<>]+/);
    let effectiveUrl = url.trim();
    if (urlInMsg) {
      effectiveUrl = urlInMsg[0];
      setUrl(effectiveUrl);
    }
    if (!effectiveUrl) {
      setMessages((m) => [...m, { role: 'user', content: text }, { role: 'assistant', content: 'Lipește un link oficial (sus sau direct în mesaj) și spune-mi ce să import. 🙂' }]);
      setInput('');
      return;
    }
    const cleanMessage = text.replace(/https?:\/\/[^\s<>]+/g, '').replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim() || 'importă ce e relevant';

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const { data, base } = await importPost('/api/import/chat', { url: effectiveUrl, message: cleanMessage, history });
      if (data.error && !(data.materials || []).length) throw new Error(data.error);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply, materials: data.materials, session: data.session, base }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${e instanceof Error ? e.message : 'Eroare'}. Dacă e o sursă oficială (subiecte.edu.ro/pbinfo), pornește serverul local.` }]);
    } finally {
      setLoading(false);
    }
  };

  const doImport = async (msg: Msg) => {
    if (!msg.materials?.length || !msg.session || committing) return;
    const chosenNames = sel[msg.session] ?? msg.materials.map((m) => m.file_name);
    const chosen = msg.materials.filter((m) => chosenNames.includes(m.file_name));
    if (!chosen.length) return;
    const ok = window.confirm(
      `Sigur vrei să publici ${chosen.length} fișiere pe platformă?\n\nElevii le vor vedea imediat pe site. Această acțiune scrie în baza de date live.`,
    );
    if (!ok) return;
    setCommitting(true);
    try {
      const res = await fetch(`${msg.base || HOSTED_URL}/api/import/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: msg.session, materials: chosen, genre: section, token: (authSession as { access_token?: string } | null)?.access_token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Eroare la import');
      setMessages((m) => [...m, { role: 'assistant', content: `✅ Am publicat ${data.imported} materiale pe platformă. Sunt vizibile la elevi.` }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ Publicarea a eșuat: ${e instanceof Error ? e.message : 'eroare'}.` }]);
    } finally {
      setCommitting(false);
    }
  };

  if (!isProf) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Card className="p-8 text-center">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-amber-500" />
          <h2 className="font-semibold text-lg mb-1">Doar pentru profesori</h2>
          <p className="text-sm text-muted-foreground mb-4">Autentifică-te cu un cont de profesor pentru a importa subiecte.</p>
          <Button onClick={() => navigate('/auth-profesor')}>Autentifică-te ca profesor</Button>
        </Card>
      </div>
    );
  }

  const chipCls = (active: boolean) =>
    `text-xs px-2.5 py-1.5 rounded-md border transition ${active ? 'bg-primary/10 border-primary/40 text-primary font-medium' : 'border-border text-muted-foreground hover:bg-muted'}`;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-tight">Import subiecte BAC</h1>
          <p className="text-xs text-muted-foreground">Alege materia și filtrele, apoi publică pe platformă.</p>
        </div>
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">Profesor</Badge>
      </div>

      {browseMode ? (
        /* Răsfoire manuală (escape hatch) */
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="border-b p-3 flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setBrowseMode(false)}>← Înapoi la filtre</Button>
            {browseStack.length > 0 && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={goBack}><ChevronLeft className="w-3.5 h-3.5 mr-1" />Înapoi</Button>
            )}
            <span className="text-[11px] text-muted-foreground truncate flex-1 min-w-0">{browseUrl}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {browseLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3"><Loader2 className="w-4 h-4 animate-spin" /> se încarcă…</div>
            ) : browseItems.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3">{browseInfo || 'Nimic aici.'}</p>
            ) : (
              browseItems.map((it) => it.kind === 'page' ? (
                <button key={it.id} onClick={() => drillIn(it)} className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted text-left text-sm">
                  <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="flex-1 min-w-0 truncate">{it.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ) : (
                <div key={it.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm">
                  <input type="checkbox" className="shrink-0" checked={browseChecked.has(it.id)} onChange={() => toggleCheck(it.id)} />
                  <FileText className={`w-4 h-4 shrink-0 ${it.tip === 'barem' ? 'text-violet-500' : 'text-sky-500'}`} />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleCheck(it.id)}>
                    <span className="block truncate">{it.title || it.label}</span>
                    <span className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {it.tip && <Badge variant="outline" className={`text-[9px] px-1 py-0 ${it.tip === 'barem' ? 'text-violet-700 border-violet-200' : 'text-sky-700 border-sky-200'}`}>{it.tip}</Badge>}
                      {it.profil && <span className="text-[10px] text-muted-foreground">{it.profil}</span>}
                      {it.year && <span className="text-[10px] text-muted-foreground">· {it.year}</span>}
                    </span>
                  </div>
                  {it.href && (
                    <a href={it.href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 text-[11px] text-primary hover:underline flex items-center gap-0.5">
                      <Eye className="w-3 h-3" /> vezi
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="border-t p-3 flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground flex-1 truncate">{browseInfo || `${browseChecked.size} bifate`}</span>
            <Button size="sm" className="h-8 text-xs" onClick={doBrowseImport} disabled={browseImporting || !browseChecked.size}>
              {browseImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : `Publică bifate (${browseChecked.size})`}
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* BARA DE FILTRE */}
          <Card className="p-3 mb-3 space-y-3">
            {/* Materie */}
            <div className="flex gap-1.5 flex-wrap">
              {SUBJECTS.map((s) => (
                <button key={s.slug} type="button" onClick={() => pickSubject(s.slug)}
                  className={`text-sm px-3 py-1.5 rounded-md border transition ${subject === s.slug ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Filtre adaptate materiei */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              <div>
                <div className="text-[11px] text-muted-foreground mb-1">An</div>
                <select value={year} onChange={(e) => setYear(e.target.value)}
                  className="w-full h-9 text-sm rounded-md border border-input bg-background px-2">
                  {YEARS.map((y) => <option key={y} value={y}>{y || 'Toți anii'}</option>)}
                </select>
              </div>

              {subjCfg.spec.length > 0 && (
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">Specializare</div>
                  <div className="flex gap-1.5 flex-wrap">
                    <button type="button" className={chipCls(!specializare)} onClick={() => setSpecializare(null)}>Toate</button>
                    {subjCfg.spec.map((sp) => (
                      <button key={sp} type="button" className={chipCls(specializare === sp)} onClick={() => setSpecializare(sp)}>{SPEC_LABEL[sp]}</button>
                    ))}
                  </div>
                </div>
              )}

              {subjCfg.lang && (
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">Limbaj</div>
                  <div className="flex gap-1.5 flex-wrap">
                    <button type="button" className={chipCls(!limbaj)} onClick={() => setLimbaj(null)}>Ambele</button>
                    <button type="button" className={chipCls(limbaj === 'c')} onClick={() => setLimbaj('c')}>C/C++</button>
                    <button type="button" className={chipCls(limbaj === 'pascal')} onClick={() => setLimbaj('pascal')}>Pascal</button>
                  </div>
                </div>
              )}

              <div>
                <div className="text-[11px] text-muted-foreground mb-1">Tip</div>
                <div className="flex gap-1.5 flex-wrap">
                  {TIPS.map((t) => (
                    <button key={t.v} type="button" className={chipCls(tip === t.v)} onClick={() => setTip(t.v)}>{t.l}</button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="text-[11px] text-muted-foreground mb-1">Secțiune (unde apar la elevi în Modele BAC)</div>
                <select value={section} onChange={(e) => setSection(e.target.value)}
                  className="w-full h-9 text-sm rounded-md border border-input bg-background px-2">
                  {SECTIONS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
              </div>
            </div>

            {/* Link + buton */}
            <div>
              <label className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-1">
                <Link2 className="w-3.5 h-3.5" /> Link sursă
              </label>
              <div className="flex gap-2">
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://subiecte.edu.ro/..." className="text-sm" />
                <Button onClick={runFilter} disabled={loading} className="shrink-0 gap-1.5">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Adu subiectele
                </Button>
              </div>
              <button type="button" onClick={openBrowse} disabled={!url.trim()} className="mt-1.5 text-xs text-muted-foreground hover:text-primary hover:underline flex items-center gap-1 disabled:opacity-50">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Răsfoiește pagina manual (pentru site-uri neobișnuite)
              </button>
            </div>
          </Card>

          {/* Rezultate + chat secundar */}
          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.materials && m.materials.length > 0 && m.session && (() => {
                      const session = m.session;
                      const allNames = m.materials.map((x) => x.file_name);
                      const chosen = sel[session] ?? allNames;
                      const allOn = chosen.length === allNames.length;
                      return (
                        <>
                          <div className="mt-3 border-t border-border/50 pt-3">
                            <label className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={allOn}
                                onChange={() => setSel((s) => ({ ...s, [session]: allOn ? [] : allNames }))}
                              />
                              {allOn ? 'Debifează tot' : 'Bifează tot'} · {chosen.length}/{allNames.length} selectate
                            </label>
                            <ul className="space-y-1.5">
                              {m.materials.map((mat, j) => {
                                const on = chosen.includes(mat.file_name);
                                return (
                                  <li key={j} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      className="shrink-0"
                                      checked={on}
                                      onChange={() => toggle(session, mat.file_name, allNames)}
                                    />
                                    <FileText className={`w-4 h-4 shrink-0 ${mat.tip === 'barem' ? 'text-violet-500' : 'text-sky-500'}`} />
                                    <span className="flex-1 min-w-0 truncate text-xs" title={mat.file_name}>{mat.title}</span>
                                    <Badge variant="outline" className={`shrink-0 text-[9px] px-1.5 ${mat.tip === 'barem' ? 'text-violet-700 border-violet-200' : 'text-sky-700 border-sky-200'}`}>{mat.tip}</Badge>
                                    <a href={`${m.base || HOSTED_URL}${mat.previewUrl}`} target="_blank" rel="noreferrer" className="shrink-0 text-[11px] text-primary hover:underline flex items-center gap-0.5">
                                      <Eye className="w-3 h-3" /> vezi
                                    </a>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                          <div className="mt-3 flex items-center gap-2 rounded-lg bg-background/60 p-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="text-[11px] text-muted-foreground flex-1">Bifează ce vrei. La publicare, elevii le văd imediat.</span>
                            <Button size="sm" className="h-7 text-xs" onClick={() => doImport(m)} disabled={committing || !chosen.length}>
                              {committing ? <Loader2 className="w-3 h-3 animate-spin" /> : `Publică (${chosen.length})`}
                            </Button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> aduc subiectele…
                  </div>
                </div>
              )}
            </div>

            {/* Chat secundar: cereri speciale */}
            <div className="border-t p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
                  placeholder="Cerere specială? ex: doar variantele 1–5, scoate simulările…"
                  disabled={loading}
                />
                <Button onClick={send} disabled={loading || !input.trim()} size="icon" variant="outline" className="shrink-0">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
