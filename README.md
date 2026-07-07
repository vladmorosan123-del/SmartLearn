# SmartLearning

Platformă de învățare pentru BAC (Colegiul Național Militar „Ștefan cel Mare"), cu **tutor AI** care răspunde din materialele încărcate pe platformă.

Frontend: React + Vite + TypeScript + Tailwind/shadcn. Backend de date: Supabase.

---

## 1. Pornire frontend (local)

```bash
npm install
npm run dev
```

Site-ul pornește pe `http://localhost:8080` (sau portul dat cu `--port`).

Variabile de mediu (în `.env`):
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` — conexiunea la Supabase (datele reale)
- `VITE_AI_URL` — adresa serverului AI (ex. `http://localhost:3030` local, sau URL-ul public în producție)

---

## 2. Tutorul AI

Serverul AI e separat, în `server/ai-rag.js` (Node + Express, port **3030**).

Ce face:
- Citește materialele din Supabase prin RPC-ul public `get_materials_for_students` (nu are nevoie de parola bazei)
- Extrage textul (PDF, DOCX, PPTX; OCR cu Gemini pentru imagini/PDF scanate)
- Face embeddings și le ține într-un index local (`rag-index.json`)
- La întrebare: caută bucățile relevante și răspunde cu **Gemini**, pe înțelesul elevilor, cu memorie de conversație

### Pornire server AI

```bash
cd server
node ai-rag.js
```

Pe Windows există și scurtătura **„Pornire AI SmartLearn.bat"** (pornește serverul AI + site-ul dintr-un dublu-click).

### Configurare (server/.env)
- `GEMINI_API_KEY` — cheia Gemini (Google AI Studio)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — pentru citirea materialelor

### Schimbarea cheii Gemini
Când vrei altă cheie (ex. una cu facturare, fără limită gratuită):
1. Deschide `server/.env`
2. Înlocuiește valoarea de la `GEMINI_API_KEY=`
3. Repornește serverul AI

Fără modificări de cod. (Modelul se schimbă tot dintr-o linie: `CHAT_MODEL` în `ai-rag.js`.)

### Reindexarea materialelor
Când adaugi/schimbi materiale pe platformă, actualizează indexul AI:

```bash
curl -X POST http://localhost:3030/api/ai/index-local
```

Indexarea e incrementală (adaugă doar ce lipsește). Pentru refacere completă: trimite `{"reindex":true}` în corp.

---

## 3. Deploy

- **Frontend**: build cu `npm run build` (folderul `dist/`), publicat de pe GitHub pe orice hosting static.
- **Server AI**: rulează pe orice host Node (VPS sau cloud gratuit tip Render/Railway). Setează `VITE_AI_URL` în frontend să arate spre URL-ul lui public.

> Notă: planul gratuit Gemini are o limită zilnică — suficient pentru testare, dar pentru mulți utilizatori simultan e nevoie de o cheie cu facturare activată.
