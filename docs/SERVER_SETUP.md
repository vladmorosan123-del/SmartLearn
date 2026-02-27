# Configurare Server Propriu pentru Stocare Fișiere

## Prezentare Generală

Aplicația Smart Learning este pregătită să se conecteze la un server propriu pentru stocarea fișierelor (PDF-uri, imagini, video-uri). Când serverul este configurat, toate operațiunile de upload, descărcare și ștergere vor trece prin API-ul serverului în loc de cloud storage.

---

## 1. Activare

Setați variabila de environment în fișierul `.env` al aplicației:

```env
VITE_SERVER_URL=https://server-vostru.example.com
```

Aplicația detectează automat această variabilă. Dacă este setată, toate operațiunile de stocare sunt redirecționate către server. Dacă nu este setată, aplicația continuă să folosească cloud storage (comportamentul actual).

---

## 2. Endpoint-uri API necesare

Serverul trebuie să implementeze **3 endpoint-uri REST**:

### 2.1 `POST /api/storage/upload`

Încarcă un fișier pe server.

**Request:**
- `Content-Type: multipart/form-data`
- Header: `Authorization: Bearer <jwt_token>`
- Form fields:
  - `file` — fișierul binar
  - `bucket` — numele bucket-ului (ex: `"materials"`)
  - `path` — calea în care se salvează fișierul (ex: `"lectii/romana/1709123456_fisier.pdf"`)

**Response (JSON):**
```json
{
  "url": "https://server-vostru.example.com/files/materials/lectii/romana/1709123456_fisier.pdf",
  "path": "lectii/romana/1709123456_fisier.pdf"
}
```

### 2.2 `GET /api/storage/signed-url`

Generează un URL temporar pentru accesarea securizată a unui fișier.

**Query Parameters:**
- `url` — URL-ul fișierului stocat în baza de date
- `expires` — durata de valabilitate în secunde (default: 3600)

**Header:** `Authorization: Bearer <jwt_token>`

**Response (JSON):**
```json
{
  "signedUrl": "https://server-vostru.example.com/files/materials/lectii/romana/fisier.pdf?token=abc123&expires=1709127056"
}
```

### 2.3 `DELETE /api/storage/delete`

Șterge un fișier de pe server.

**Request:**
- `Content-Type: application/json`
- Header: `Authorization: Bearer <jwt_token>`
- Body:
```json
{
  "bucket": "materials",
  "path": "lectii/romana/1709123456_fisier.pdf"
}
```

**Response:** `200 OK` (fără body obligatoriu)

---

## 3. Structura Folderelor pe Server

```
/var/www/storage/              ← directorul rădăcină pentru fișiere
└── materials/                 ← bucket-ul principal
    ├── lectii/
    │   ├── romana/
    │   │   ├── 1709123456_fisier.pdf
    │   │   └── 1709123457_alt_fisier.pdf
    │   ├── matematica/
    │   └── ...
    ├── modele-bac/
    ├── eseuri-bac/
    ├── subiect2-bac/
    └── teste-academii/
```

---

## 4. Permisiuni (Linux)

```bash
# Creare folder
sudo mkdir -p /var/www/storage/materials
sudo chown -R www-data:www-data /var/www/storage
sudo chmod -R 755 /var/www/storage
```

---

## 5. Tehnologie Backend Recomandată

Puteți folosi orice limbaj/framework. Exemple:

### Node.js (Express)

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const STORAGE_ROOT = '/var/www/storage';

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

// Middleware autentificare (verifică JWT)
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // TODO: Verifică token-ul JWT cu cheia secretă Supabase
  next();
};

// Upload
const upload = multer({ dest: '/tmp/uploads' });
app.post('/api/storage/upload', authenticate, upload.single('file'), (req, res) => {
  const { bucket, path: filePath } = req.body;
  const destDir = path.join(STORAGE_ROOT, bucket, path.dirname(filePath));
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(STORAGE_ROOT, bucket, filePath);
  fs.renameSync(req.file.path, destPath);
  res.json({
    url: `${req.protocol}://${req.get('host')}/files/${bucket}/${filePath}`,
    path: filePath,
  });
});

// Signed URL
app.get('/api/storage/signed-url', authenticate, (req, res) => {
  const { url, expires = '3600' } = req.query;
  const token = crypto.randomBytes(32).toString('hex');
  // TODO: Salvează token-ul cu expirare
  res.json({ signedUrl: `${url}?token=${token}&expires=${Date.now() + parseInt(expires) * 1000}` });
});

// Delete
app.delete('/api/storage/delete', authenticate, (req, res) => {
  const { bucket, path: filePath } = req.body;
  const fullPath = path.join(STORAGE_ROOT, bucket, filePath);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  res.sendStatus(200);
});

// Serve fișiere statice
app.use('/files', express.static(STORAGE_ROOT));

app.listen(3001, () => console.log('Storage server running on :3001'));
```

### Python (Flask) / PHP (Laravel) — Aceeași structură de endpoint-uri.

---

## 6. Cerințe Minime Server

| Cerință | Valoare recomandată |
|---------|-------------------|
| OS | Ubuntu 22.04+ / Debian 12+ |
| RAM | minim 2 GB |
| Disk | minim 50 GB (depinde de volumul fișierelor) |
| Web Server | Nginx ca reverse proxy |
| Runtime | Node.js 18+ / Python 3.10+ / PHP 8.1+ |
| HTTPS | Obligatoriu (Let's Encrypt / certificat propriu) |
| CORS | Permis pentru domeniul aplicației |

---

## 7. Configurare Nginx (Reverse Proxy)

```nginx
server {
    listen 443 ssl;
    server_name storage.liceul-vostru.ro;

    ssl_certificate /etc/letsencrypt/live/storage.liceul-vostru.ro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/storage.liceul-vostru.ro/privkey.pem;

    client_max_body_size 100M;  # pentru video-uri

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /files/ {
        alias /var/www/storage/;
        expires 1h;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

## 8. Securitate

- **HTTPS obligatoriu** — toate transferurile de fișiere trebuie criptate
- **Autentificare JWT** — fiecare request trebuie să aibă token valid
- **Validare fișiere** — verificați extensia și dimensiunea pe server (max 10MB documente, 100MB video)
- **Path traversal** — sanitizați calea fișierului pentru a preveni accesul la alte directoare
- **Rate limiting** — limitați upload-urile la max 10/minut per utilizator
- **Backup** — configurați backup automat al folderului de stocare

---

## 9. Rezumat Pași de Implementare

1. ✅ Aplicația este deja pregătită (codul de abstractizare este implementat)
2. ⬜ Configurați serverul cu unul din framework-urile de mai sus
3. ⬜ Implementați cele 3 endpoint-uri API
4. ⬜ Configurați HTTPS și Nginx
5. ⬜ Setați `VITE_SERVER_URL` în aplicație
6. ⬜ Testați upload, vizualizare și ștergere
