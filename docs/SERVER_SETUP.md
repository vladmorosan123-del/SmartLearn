# SmartLearning — Ghid Complet Server Propriu

## Prezentare generală

Aplicația SmartLearning poate funcționa în două moduri:
1. **Lovable Cloud** — modul curent, fără configurare suplimentară
2. **Server propriu (Express.js + PostgreSQL)** — independență completă

Această documentație descrie configurarea modului 2.

---

## Arhitectura serverului

```
server/
├── index.js              # Entry point Express
├── package.json          # Dependențe Node.js
├── .env.example          # Template configurare
├── db/
│   ├── pool.js           # Conexiune PostgreSQL
│   └── schema.sql        # Schema completă a bazei de date
├── middleware/
│   └── auth.js           # JWT auth & role middleware
└── routes/
    ├── auth.js           # Login, register, logout, password update
    ├── db.js             # CRUD generic pentru toate tabelele
    ├── rpc.js            # Funcții PostgreSQL echivalente
    ├── functions.js      # Admin management, create user, verify quiz
    └── storage.js        # Upload/download/delete fișiere local
```

---

## Cerințe sistem

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **Disk space** ≥ 10GB (pentru fișiere stocate)
- **RAM** ≥ 1GB
- **OS** recomandat: Ubuntu 22.04+, Debian 12+

---

## Pași de instalare

### 1. Clonează și instalează dependențele

```bash
cd server
npm install
```

### 2. Configurează baza de date

```bash
sudo -u postgres createdb smartlearning
psql -U postgres -d smartlearning -f db/schema.sql
```

### 3. Configurează variabilele de mediu

```bash
cp .env.example .env
nano .env
```

Completează:
- `JWT_SECRET` — generează cu `openssl rand -hex 64`
- `DB_PASSWORD` — parola PostgreSQL
- `STORAGE_PATH` — calea absolută pentru fișiere (ex: `/var/data/smartlearning/uploads`)
- `SERVER_PUBLIC_URL` — URL-ul public al serverului (ex: `https://api.scoala-ta.ro`)
- `CORS_ORIGINS` — URL-ul frontend-ului (ex: `https://smartlearningtvc.lovable.app`)

### 4. Creează directorul de stocare

```bash
sudo mkdir -p /var/data/smartlearning/uploads/materials
sudo chown -R $USER:$USER /var/data/smartlearning
chmod -R 755 /var/data/smartlearning
```

### 5. Creează contul de administrator

```bash
node -e "
const bcrypt = require('bcryptjs');
const sha256 = 'YOUR_SHA256_HASH_HERE'; // SHA-256 of 'plutonul.7'
bcrypt.hash(sha256, 10).then(h => console.log('Hash:', h));
"
```

Apoi inserează manual:
```sql
INSERT INTO users (email, password_hash) 
VALUES ('administrator.7@lm.local', '<bcrypt_hash>');

SELECT id FROM users WHERE email = 'administrator.7@lm.local';

INSERT INTO profiles (user_id, username, full_name) 
VALUES ('<user_id>', 'administrator.7', 'Administrator');

INSERT INTO user_roles (user_id, role) 
VALUES ('<user_id>', 'admin');
```

### 6. Pornește serverul

```bash
npm run dev   # Development
npm start     # Production
```

### 7. Configurează frontend-ul

Setează variabila de mediu:
```
VITE_SERVER_URL=https://api.scoala-ta.ro
```

---

## API Endpoints

### Autentificare (`/api/auth/`)

| Metodă | Endpoint | Descriere | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/login` | Login cu email + SHA-256 password | ❌ |
| POST | `/api/auth/register` | Creează cont nou | ❌ |
| POST | `/api/auth/logout` | Logout (stateless) | ✅ |
| GET | `/api/auth/me` | Info utilizator curent | ✅ |
| PUT | `/api/auth/password` | Schimbă parola | ✅ |

### Baza de date (`/api/db/`)

| Metodă | Endpoint | Descriere | Auth |
|--------|----------|-----------|------|
| GET | `/api/db/:table` | SELECT cu filtre | ✅ |
| POST | `/api/db/:table` | INSERT | ✅ |
| PUT | `/api/db/:table` | UPDATE | ✅ |
| DELETE | `/api/db/:table` | DELETE | ✅ |

Tabele permise: `materials`, `profiles`, `user_roles`, `tvc_submissions`, `lesson_views`, `invitation_codes`

### Funcții RPC (`/api/rpc/`)

| Metodă | Endpoint | Descriere |
|--------|----------|-----------|
| POST | `/api/rpc/get_user_role` | Obține rolul utilizatorului |
| POST | `/api/rpc/has_role` | Verifică dacă utilizatorul are un rol |
| POST | `/api/rpc/is_admin` | Verifică dacă e admin |
| POST | `/api/rpc/verify_invitation_code` | Verifică cod de invitație |
| POST | `/api/rpc/get_materials_for_students` | Materiale fără answer_key |
| POST | `/api/rpc/get_material_question_count` | Număr întrebări |
| POST | `/api/rpc/get_material_answer_key` | Cheie răspunsuri (doar profesori) |

### Funcții Admin (`/api/functions/`)

| Metodă | Endpoint | Descriere |
|--------|----------|-----------|
| POST | `/api/functions/admin-management` | Toate acțiunile admin |
| POST | `/api/functions/create-user` | Creează cont elev |
| POST | `/api/functions/update-password` | Resetează parola (admin) |
| POST | `/api/functions/verify-quiz-answers` | Verifică răspunsuri quiz |

### Stocare (`/api/storage/`)

| Metodă | Endpoint | Descriere |
|--------|----------|-----------|
| POST | `/api/storage/upload` | Upload fișier |
| GET | `/api/storage/signed-url` | URL de acces |
| DELETE | `/api/storage/delete` | Șterge fișier |

---

## Frontend API Client (`src/lib/apiClient.ts`)

Clientul API unificat detectează automat backend-ul:

```typescript
import { apiClient } from '@/lib/apiClient';

// Funcționează identic indiferent de backend
const { data } = await apiClient.from('materials').select('*').eq('category', 'lectie');
const { data: role } = await apiClient.rpc('get_user_role', { _user_id: '...' });
const { data } = await apiClient.functions.invoke('admin-management', { body: { action: '...' } });
```

Dacă `VITE_SERVER_URL` este setat → Express server. Altfel → Supabase Cloud.

---

## Securitate

- Parole: SHA-256 (client) → bcrypt (server)
- JWT cu expirare configurabilă
- Middleware role-based (`requireAuth`, `requireAdmin`, `requireProfesor`)
- Filtrare automată pe `user_id` pentru studenți
- Protecție path traversal pe stocare
- HTTPS obligatoriu în producție

---

## Deploy producție

### PM2
```bash
npm install -g pm2
pm2 start index.js --name smartlearning-api
pm2 save && pm2 startup
```

### Nginx reverse proxy
```nginx
server {
    listen 443 ssl;
    server_name api.scoala-ta.ro;

    ssl_certificate /etc/letsencrypt/live/api.scoala-ta.ro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.scoala-ta.ro/privkey.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Migrare date

1. Exportă datele din backend-ul curent
2. Importă în PostgreSQL cu `psql -f export.sql`
3. Mută fișierele în `STORAGE_PATH/materials/`
4. Actualizează URL-urile din tabela `materials` dacă e necesar
