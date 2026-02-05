# BPKPD REST API

REST API Backend untuk sistem BPKPD dengan akses **read-only** ke database legacy PostgreSQL.

---

## 📋 Daftar Isi

- [Tentang Project](#tentang-project)
- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Arsitektur](#arsitektur)
- [Struktur Folder](#struktur-folder)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [API Documentation](#api-documentation)
- [Response Format](#response-format)
- [Alur Request](#alur-request)

---

## 🎯 Tentang Project

API ini dibangun untuk mengakses data dari database legacy PostgreSQL yang sudah ada (250+ tabel), tetapi **hanya menggunakan ±5 tabel** untuk keperluan bisnis tertentu.

**Karakteristik:**
- Database **READ ONLY** (tidak ada INSERT/UPDATE/DELETE)
- Banyak logic perhitungan & normalisasi data di backend
- **TIDAK menggunakan ORM** (NO Prisma, NO Sequelize)
- Query menggunakan **SQL mentah** via library `pg`
- Semua konfigurasi dari file `.env`
- API untuk sistem internal (tidak ada login user)

---

## ✨ Fitur Utama

✅ **Modular Architecture** - Struktur per-module (domain-based)  
✅ **TypeScript** - Type-safe untuk konsistensi data  
✅ **Pure Functions** - Perhitungan terpisah dari business logic  
✅ **Connection Pool** - Performa optimal untuk database  
✅ **API Key Auth** - Keamanan sederhana  
✅ **Standard Response** - Format JSON yang konsisten  
✅ **Pagination** - List data dengan pagination metadata  
✅ **Error Handling** - Penanganan error yang jelas  
✅ **Graceful Shutdown** - Clean shutdown saat terminate

---

## 🛠️ Teknologi

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Query:** Raw SQL via `pg` library
- **Environment:** dotenv

---

## 🏗️ Arsitektur

API ini menggunakan **Layered Architecture** per module:

```
┌─────────────────┐
│     Route       │  ← Mapping URL ke Controller
└────────┬────────┘
         │
┌────────▼────────┐
│   Controller    │  ← Handle Request/Response + Validasi
└────────┬────────┘
         │
┌────────▼────────┐
│    Service      │  ← Business Logic (Orkestrasi)
└────┬──────┬─────┘
     │      │
┌────▼──┐ ┌─▼────────┐
│ Query │ │Calculate │  ← Query DB + Pure Functions
└───────┘ └──────────┘
```

**Penjelasan Layer:**

| Layer | Fungsi | Contoh |
|-------|--------|--------|
| **Route** | Mapping HTTP method + URL ke controller | `GET /api/kendaraan` → `getAllKendaraan()` |
| **Controller** | Handle request & response, validasi input | Ambil query params, validasi, panggil service |
| **Service** | Orkestrasi business logic | Panggil query, transform data, return result |
| **Query** | SQL mentah untuk SELECT data | `SELECT * FROM kendaraan WHERE nopol = $1` |
| **Calculate** | Pure function untuk perhitungan | `hitungDenda()`, `hitungUsia()` |
| **Type** | TypeScript interface/type | Interface untuk typing data |

---

## 📁 Struktur Folder

```
src/
├─ app.ts                      # Express app setup
├─ server.ts                   # HTTP server & startup
│
├─ config/
│  ├─ env.ts                   # Environment variables
│  ├─ app.config.ts            # App configuration
│  └─ database.config.ts       # Database configuration
│
├─ db/
│  └─ postgres.ts              # PostgreSQL connection pool
│
├─ middlewares/
│  ├─ apiKey.middleware.ts     # API key validation
│  ├─ error.middleware.ts      # Global error handler
│  └─ notFound.middleware.ts   # 404 handler
│
├─ modules/
│  ├─ kendaraan/               # Module kendaraan
│  │  ├─ kendaraan.route.ts
│  │  ├─ kendaraan.controller.ts
│  │  ├─ kendaraan.service.ts
│  │  ├─ kendaraan.query.ts
│  │  ├─ kendaraan.calculate.ts
│  │  └─ kendaraan.type.ts
│  │
│  ├─ pajak/                   # Module pajak
│  └─ swdkllj/                 # Module SWDKLLJ
│
├─ utils/
│  ├─ date.util.ts             # Date helpers
│  ├─ number.util.ts           # Number helpers
│  ├─ response.util.ts         # Response helpers
│  └─ logger.util.ts           # Logger
│
├─ constants/
│  ├─ responseCode.ts          # Response codes
│  └─ message.ts               # Messages
│
└─ shared/
   └─ calculations/
      └─ denda.helper.ts       # Shared calculation
```

---

## 🚀 Cara Install & Run

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Copy file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Edit file `.env` sesuai dengan konfigurasi database Anda:

```env
APP_NAME=BPKPD API
APP_PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=bpkpd_db
DB_USER=postgres
DB_PASSWORD=password123

API_KEY=your-secret-api-key-here
```

### 3. Run Development

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### 4. Build & Run Production

```bash
# Build TypeScript ke JavaScript
npm run build

# Run production
npm start
```

---

## 🔐 Authentikasi

API menggunakan **API Key** sederhana yang dikirim via header.

### Header Request

```
X-API-KEY: your-secret-api-key-here
```

### Endpoint Tanpa API Key

- `GET /health` - Health check

### Endpoint Dengan API Key

Semua endpoint di bawah `/api/*` memerlukan API key.

---

## 📡 API Documentation

Semua endpoint butuh header:
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
        "timestamp": "2024-02-04T10:00:00.000Z",
        "uptime": 123.45,
        "environment": "development"
    }
}
```

---

### Module Kendaraan

#### 1. Get All Kendaraan (dengan pagination)

```http
GET /api/kendaraan?page=1&limit=10
```

Query Parameters:
- `page` (optional) - Halaman (default: 1)
- `limit` (optional) - Item per halaman (default: 10)

Response:
```json
{
    "status": true,
    "message": "Data ditemukan",
    "data": {
        "items": [
            {
                "id": 1,
                "nopol": "B1234XYZ",
                "merk": "Honda",
                "usia": 5
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 10,
            "totalItems": 1,
            "totalPage": 1
        }
    }
}
```

#### 2. Search Kendaraan

```http
GET /api/kendaraan/search?q=honda&page=1&limit=10
```

#### 3. Get Kendaraan by Nopol (detail)

```http
GET /api/kendaraan/nopol/B1234XYZ
```

Response:
```json
{
    "status": true,
    "message": "Data ditemukan",
    "data": {
        "id": 1,
        "nopol": "B1234XYZ",
        "noRangka": "MH1ABC123456",
        "merk": "Honda",
        "tipe": "Vario 150",
        "pemilik": {
            "nama": "John Doe",
            "alamat": "Jakarta"
        },
        "usia": 7
    }
}
```

#### 4. Get Kendaraan by ID

```http
GET /api/kendaraan/123
```

---

### Module Pajak

#### 1. Get Pajak by Nopol

```http
GET /api/pajak/nopol/B1234XYZ
```

#### 2. Get Pajak by ID

```http
GET /api/pajak/123
```

#### 3. Get Pajak Belum Bayar (dengan pagination)

```http
GET /api/pajak/belum-bayar?page=1&limit=10
```

#### 4. Hitung Pajak dengan Denda

```http
POST /api/pajak/hitung-denda
Content-Type: application/json

Body:
{
    "nopol": "B1234XYZ",
    "tahun": 2024,
    "tanggal_bayar": "2024-12-31"
}
```

Response:
```json
{
    "status": true,
    "message": "Kalkulasi pajak berhasil",
    "data": {
        "nopol": "B1234XYZ",
        "tahunPajak": 2024,
        "pokokPajak": 500000,
        "pokokPajakFormatted": "Rp 500.000",
        "denda": 20000,
        "dendaFormatted": "Rp 20.000",
        "totalBayar": 520000,
        "totalBayarFormatted": "Rp 520.000"
    }
}
```

---

### Module SWDKLLJ

#### 1. Get SWDKLLJ by Nopol

```http
GET /api/swdkllj/nopol/B1234XYZ
```

#### 2. Get SWDKLLJ by ID

```http
GET /api/swdkllj/123
```

#### 3. Get SWDKLLJ Belum Bayar (dengan pagination)

```http
GET /api/swdkllj/belum-bayar?page=1&limit=10
```

---

## 📋 Response Format

### ✅ Success Response (List dengan Pagination)

```json
{
    "status": true,
    "message": "Success",
    "data": {
        "items": [...],
        "pagination": {
            "page": 1,
            "limit": 10,
            "totalItems": 100,
            "totalPage": 10
        }
    }
}
```

### ✅ Success Response (Detail/Single)

```json
{
    "status": true,
    "message": "Success",
    "data": {
        "id": 1,
        "nopol": "B1234XYZ"
    }
}
```

### ❌ Error Response

```json
{
    "status": false,
    "message": "Error message"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

📖 **Dokumentasi lengkap:** [RESPONSE_FORMAT.md](RESPONSE_FORMAT.md)

---

## 🔄 Alur Request

```
1. User → HTTP Request
2. ↓ CORS Middleware
3. ↓ JSON Parser
4. ↓ API Key Validation
5. ↓ Route
6. ↓ Controller (validasi input)
7. ↓ Service (business logic)
8. ↓ Query (SQL) / Calculate (pure function)
9. ↓ Service (transform data)
10. ↓ Controller (format response)
11. → Response ke User
```

---

## 🧪 Contoh Request dengan cURL

### Get Kendaraan

```bash
curl -X GET "http://localhost:3000/api/kendaraan?page=1&limit=5" \
  -H "X-API-KEY: your-secret-api-key-here"
```

### Search Kendaraan

```bash
curl -X GET "http://localhost:3000/api/kendaraan/search?q=honda" \
  -H "X-API-KEY: your-secret-api-key-here"
```

### Hitung Denda Pajak

```bash
curl -X POST "http://localhost:3000/api/pajak/hitung-denda" \
  -H "X-API-KEY: your-secret-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "nopol": "B1234XYZ",
    "tahun": 2024,
    "tanggal_bayar": "2024-12-31"
  }'
```

---

## 📝 Catatan untuk Developer PHP

Jika Anda terbiasa dengan PHP, berikut perbandingannya:

| PHP | Node.js/TypeScript |
|-----|-------------------|
| `$_GET['page']` | `req.query.page` |
| `$_POST['nopol']` | `req.body.nopol` |
| `$_SERVER['HTTP_X_API_KEY']` | `req.headers['x-api-key']` |
| PDO Connection | PostgreSQL Pool |
| `$stmt->execute([$param])` | `query(sql, [param])` |
| `function hitungDenda($pokok)` | `function hitungDenda(pokok: number)` |
| `echo json_encode($data)` | `res.json(data)` |

**Perbedaan Utama:**
- TypeScript menambahkan **type checking**
- `async/await` untuk operasi database
- Module system dengan `import/export`

---

## 🆘 Troubleshooting

### Error: "Environment variable tidak ditemukan"
✅ Pastikan file `.env` sudah ada dan terisi

### Error: "Database connection failed"
✅ Cek PostgreSQL running & credential di `.env`

### Error: "API Key tidak valid"
✅ Pastikan header `X-API-KEY` sama dengan `API_KEY` di `.env`

### Port 3000 sudah dipakai
✅ Ubah `APP_PORT` di `.env`

---

## 📖 Dokumentasi Tambahan

- [RESPONSE_FORMAT.md](RESPONSE_FORMAT.md) - Dokumentasi lengkap format response

---

**Dibuat dengan ❤️ untuk BPKPD Team**

```
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2026-02-04T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

---

### Module: Kendaraan

#### Get All Kendaraan

```
GET /api/kendaraan
GET /api/kendaraan?limit=50
```

#### Get Kendaraan by ID

```
GET /api/kendaraan/:id
```

#### Get Kendaraan by Nopol

```
GET /api/kendaraan/nopol/:nopol

Contoh: GET /api/kendaraan/nopol/B1234XYZ
```

#### Search Kendaraan

```
GET /api/kendaraan/search?q=keyword
GET /api/kendaraan/search?q=Toyota&limit=20
```

**Response Example:**

```json
{
  "code": "SUCCESS",
  "message": "Data ditemukan",
  "data": [
    {
      "id": 1,
      "nopol": "B1234XYZ",
      "noRangka": "MH1AB1234ABCD5678",
      "noMesin": "AB1234567",
      "merk": "Honda",
      "tipe": "Beat",
      "jenis": "Sepeda Motor",
      "tahunBuat": 2020,
      "warna": "Hitam",
      "pemilik": {
        "nama": "John Doe",
        "alamat": "Jl. Contoh No. 123, Jakarta"
      },
      "usia": 6
    }
  ]
}
```

---

### Module: Pajak

#### Get Pajak by Nopol

```
GET /api/pajak/nopol/:nopol

Contoh: GET /api/pajak/nopol/B1234XYZ
```

#### Get Pajak by ID

```
GET /api/pajak/:id
```

#### Get Pajak Belum Bayar

```
GET /api/pajak/belum-bayar
GET /api/pajak/belum-bayar?limit=50
```

#### Hitung Pajak dengan Denda

```
POST /api/pajak/hitung-denda
Content-Type: application/json

{
  "nopol": "B1234XYZ",
  "tahun": 2024,
  "tanggal_bayar": "2024-06-15"  // opsional, default: hari ini
}
```

**Response Example:**

```json
{
  "code": "SUCCESS",
  "message": "Kalkulasi pajak berhasil",
  "data": {
    "nopol": "B1234XYZ",
    "tahunPajak": 2024,
    "pokokPajak": 500000,
    "pokokPajakFormatted": "Rp 500.000",
    "tanggalJatuhTempo": "2024-03-31",
    "tanggalHitungDenda": "2024-06-15",
    "hariTerlambat": 76,
    "denda": 30000,
    "dendaFormatted": "Rp 30.000",
    "totalBayar": 530000,
    "totalBayarFormatted": "Rp 530.000"
  }
}
```

---

### Module: SWDKLLJ

#### Get SWDKLLJ by Nopol

```
GET /api/swdkllj/nopol/:nopol
```

#### Get SWDKLLJ by ID

```
GET /api/swdkllj/:id
```

#### Get SWDKLLJ Belum Bayar

```
GET /api/swdkllj/belum-bayar
GET /api/swdkllj/belum-bayar?limit=50
```

---

## 📝 Response Format

### Success Response

```json
{
  "code": "SUCCESS",
  "message": "Berhasil",
  "data": { ... }
}
```

### Error Response

```json
{
  "code": "ERROR",
  "message": "Terjadi kesalahan",
  "errors": { ... }
}
```

### Not Found Response

```json
{
  "code": "NOT_FOUND",
  "message": "Data tidak ditemukan"
}
```

### Unauthorized Response

```json
{
  "code": "UNAUTHORIZED",
  "message": "API Key tidak valid"
}
```

---

## 🔄 Alur Request

### Contoh: Get Kendaraan by Nopol

```
1. Client request:
   GET /api/kendaraan/nopol/B1234XYZ
   Header: X-API-KEY: xxx

2. API Key Middleware
   ↓ validasi API key

3. Route (/api/kendaraan/nopol/:nopol)
   ↓ route ke controller

4. Controller (getKendaraanByNopol)
   ↓ validasi input
   ↓ panggil service

5. Service (getKendaraanByNopol)
   ↓ panggil query
   ↓ transform data

6. Query (getKendaraanByNopolQuery)
   ↓ execute SQL SELECT
   ↓ return raw data

7. Calculate (transformKendaraan)
   ↓ mapping snake_case → camelCase
   ↓ hitung usia kendaraan

8. Response ke client
   ✓ JSON format standar
```

---

## 🧮 Business Logic & Calculation

### Separation of Concerns

- **Query** (`*.query.ts`) = Ambil data dari database (SQL mentah)
- **Calculate** (`*.calculate.ts`) = Perhitungan murni (pure function, no side effect)
- **Service** (`*.service.ts`) = Orkestrasi antara query dan calculate

### Contoh: Perhitungan Denda

File: `src/shared/calculations/denda.helper.ts`

```typescript
export function hitungDenda(
  pokok: number,
  jatuhTempo: Date,
  tanggalBayar: Date = new Date(),
  persentasePerBulan: number = 2
): number {
  if (tanggalBayar <= jatuhTempo) {
    return 0;
  }

  const hariTerlambat = daysDifference(jatuhTempo, tanggalBayar);
  const bulanTerlambat = Math.ceil(hariTerlambat / 30);
  const dendaPerBulan = (pokok * persentasePerBulan) / 100;
  const totalDenda = dendaPerBulan * bulanTerlambat;

  return Math.round(totalDenda);
}
```

**Pure Function** - hanya menghitung, tidak ada side effect, mudah di-test.

---

## 🛠️ Development Tips

### Menambah Module Baru

1. Buat folder baru di `src/modules/nama-module/`
2. Buat 6 file wajib:
   - `nama-module.type.ts` - TypeScript types
   - `nama-module.query.ts` - SQL queries
   - `nama-module.calculate.ts` - Pure functions
   - `nama-module.service.ts` - Business logic
   - `nama-module.controller.ts` - HTTP handlers
   - `nama-module.route.ts` - Route definitions
3. Register route di `src/app.ts`

### Type Checking

```bash
npm run type-check
```

### SQL Query Tips

```typescript
// ✅ Good: Pakai parameterized query
const sql = `SELECT * FROM users WHERE id = $1`;
await query(sql, [userId]);

// ❌ Bad: String concatenation (SQL injection risk)
const sql = `SELECT * FROM users WHERE id = ${userId}`;
```

---

## 🤝 Untuk Developer PHP

Jika Anda terbiasa dengan PHP, berikut analogi konsepnya:

| PHP | Node.js (Project ini) |
|-----|----------------------|
| `index.php` | `server.ts` |
| `require` / `include` | `import` / `export` |
| `$_GET['id']` | `req.params.id` / `req.query.id` |
| `echo json_encode($data)` | `res.json(data)` |
| `PDO` | `pg` (library) |
| `try-catch` | `try-catch` (sama) |
| `function` | `function` / `async function` |
| `array_map()` | `array.map()` |
| `array_filter()` | `array.filter()` |

### Async/Await (Promise)

Di Node.js, operasi database bersifat **asynchronous**:

```typescript
// PHP (synchronous)
$data = $db->query("SELECT * FROM users");
echo json_encode($data);

// Node.js (asynchronous)
const data = await query("SELECT * FROM users");
res.json(data);
```

---

## 📦 Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Database Client**: pg
- **Development**: tsx (TypeScript executor)

---

## 🔒 Security Notes

- API Key sederhana untuk internal system
- Tidak ada user authentication/authorization
- Database bersifat **read-only**
- Gunakan environment variables untuk semua credentials
- Jangan commit file `.env` ke Git

---

## 📚 Scripts

```bash
# Development dengan auto-reload
npm run dev

# Type checking
npm run type-check

# Build production
npm run build

# Run production
npm start
```

---

## 📄 License

ISC

---

## 👥 Support

Untuk pertanyaan atau issue, silahkan hubungi tim BPKPD.

---

**Dibuat dengan ❤️ untuk tim BPKPD**
