# BPKPD API - REST API untuk Sistem Pajak Kendaraan

REST API Backend untuk sistem BPKPD dengan akses **read-only** ke database PostgreSQL.

---

##  Teknologi

- **Node.js 20** + **TypeScript**
- **Express.js** - Web framework
- **PostgreSQL** - Database (read-only)
- **Docker** - Containerization

---

##  Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Copy .env.example ke .env dan sesuaikan:

```env
APP_PORT=3000
NODE_ENV=development

# Database PostgreSQL
DB_HOST=103.190.214.224
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password

# API Security
API_KEY=your-secret-api-key

# External API
URL_JR=https://h2hs-penetapan.jasaraharja.co.id/penetapan/cektarif
```

### 3. Run Development

```bash
npm run dev
```

Server running di `http://localhost:3000`

---

##  Deployment dengan Docker

Gunakan **satu file pp.bat** untuk semua keperluan deployment:

### Commands Available

```cmd
app.bat deploy      # Deploy/update aplikasi dari GitHub
app.bat rollback    # Rollback ke versi sebelumnya
app.bat start       # Start aplikasi
app.bat stop        # Stop aplikasi
app.bat restart     # Restart aplikasi
app.bat status      # Cek status & health
app.bat logs        # Lihat logs real-time
```

### Deploy Process

```cmd
app.bat deploy
```

**Script akan otomatis:**
1.  Check prerequisites (Git, Docker)
2.  Backup versi sekarang (.env + Docker image)
3.  Stop containers
4.  Pull latest code dari GitHub
5.  Check environment (.env)
6.  Run linter
7.  Build Docker image
8.  Start containers
9.  Health check (10x retry)
10.  Cleanup old backups (keep 10)

**Auto Rollback:** Jika deployment gagal, script akan tanya apakah mau rollback otomatis!

### Rollback

Jika ada masalah setelah deploy:

```cmd
app.bat rollback
```

Script akan tampilkan list backup tersedia, pilih yang mau di-restore.

### Management

```cmd
# Cek status aplikasi
app.bat status

# Lihat logs
app.bat logs

# Restart aplikasi
app.bat restart

# Stop aplikasi
app.bat stop
```

---

##  API Endpoints

Semua endpoint **butuh API Key** via header:

```
X-API-KEY: your-secret-api-key-here
```

### Health Check (tanpa API key)

```http
GET /health
```

Response:
```json
{
  "status": true,
  "message": "API is running",
  "data": {
    "timestamp": "2026-02-09T10:00:00.000Z",
    "uptime": 123.45,
    "environment": "production"
  }
}
```

### Kendaraan

```http
GET /api/kendaraan                    # List kendaraan
GET /api/kendaraan/:id                # Detail by ID
GET /api/kendaraan/nopol/:nopol       # Detail by Nopol
GET /api/kendaraan/search?q=keyword   # Search
```

### Pajak

```http
GET /api/pajak/nopol/:nopol           # Pajak by Nopol
POST /api/pajak/detail                # Detail pajak dengan rincian
```

**Request Body:**
```json
{
  "nopol": "B1234ABC"
}
```

### Jasa Raharja (JR)

```http
POST /api/jr/detail                   # Tarif JR by Nopol
```

**Request Body:**
```json
{
  "nopol": "B1234ABC"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Data berhasil diambil",
  "data": {
    "nopol": "B1234ABC",
    "merk": "Honda",
    "tipe": "Beat",
    "tahun_buat": "2020",
    "tarif_per_tahun": {
      "tahun_ke_0": {
        "kd": 35000,
        "sw": 35000,
        "dd": 70000,
        "subtotal": 140000
      },
      "tahun_ke_1": { ... },
      "tahun_ke_2": { ... },
      "tahun_ke_3": { ... },
      "tahun_ke_4": { ... }
    },
    "total_tarif": {
      "total_kd": 175000,
      "total_sw": 175000,
      "total_dd": 350000,
      "grand_total": 700000
    }
  }
}
```

---

##  Response Format

### Success

```json
{
  "status": true,
  "message": "Success message",
  "data": { ... }
}
```

### Error

```json
{
  "status": false,
  "message": "Error message"
}
```

---

##  Development Scripts

```bash
npm run dev          # Development dengan auto-reload
npm run build        # Build TypeScript ke JavaScript
npm start            # Run production
npm run type-check   # Check TypeScript types
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

---

##  Struktur Project

```
src/
 app.ts                    # Express app setup
 server.ts                 # HTTP server
 config/                   # Konfigurasi
    env.ts               # Environment variables
    database.config.ts   # Database config
 db/
    postgres.ts          # PostgreSQL connection pool
 middlewares/             # Express middlewares
    apiKey.middleware.ts
    error.middleware.ts
    validate.middleware.ts
 modules/                 # Business logic modules
    kendaraan/          # Module kendaraan
    pajak/              # Module pajak
    jr/                 # Module Jasa Raharja
 utils/                   # Utilities
     response.util.ts
     date.util.ts
     logger.util.ts
```

---

##  Docker Files

- `Dockerfile` - Multi-stage build (builder + production)
- `docker-compose.yml` - Development setup
- `docker-compose.prod.yml` - Production setup
- `.dockerignore` - Files to exclude from Docker build

---

##  Troubleshooting

### Deploy Gagal

```cmd
# Lihat logs
app.bat logs

# Rollback ke versi sebelumnya
app.bat rollback

# Check status
app.bat status
```

### Build Error di Docker

Jika `app.bat deploy` gagal saat build:

1. Clear Docker cache: `docker buildx prune -af`
2. Deploy ulang: `app.bat deploy`

### Database Connection Error

1. Pastikan PostgreSQL running
2. Check credentials di `.env`
3. Check network/firewall

---

##  Support

Untuk pertanyaan atau issue, hubungi tim BPKPD.

---

**Made with  by BPKPD Team**
