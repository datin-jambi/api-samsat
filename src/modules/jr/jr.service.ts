import { env } from '../../config/env';
import { getKendaraanByNopol } from '../kendaraan/kendaraan.service';
import { JrApiRequest, JrApiResponse, JrResponse } from './jr.type';

/**
 * Type untuk network error
 */
interface NetworkError extends Error {
  cause?: {
    code?: string;
    message?: string;
  };
  startTime?: number;
}

/**
 * Constants untuk API JR
 */
const JR_CONSTANTS = {
  API_KEY: 'Y6SpAZqD8o',
  CAT: 'SW_CHECK_TARIF',
  TIPE: 'getData',
  SESID: 'JAMBI-002',
  KODE_CABANG: '21',
  JML_BULAN_PRORATA: '0',
};

/**
 * Format tanggal untuk API JR (DD/MM/YYYY)
 */
function formatTanggalJr(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Convert tanggal dari format YYYY-MM-DD ke Date object
 */
function parseTanggal(tanggal: string): Date {
  // Format dari database: YYYY-MM-DD
  const [year, month, day] = tanggal.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Hitung masa laku yang akan datang
 * Jika sudah lewat dari hari ini, tambah tahun sampai melebihi hari ini
 */
function hitungMasaLakuYangAkanDatang(tanggal: string): string {
  const date = parseTanggal(tanggal);
  const today = new Date();
  
  // Set jam ke 0 untuk perbandingan tanggal saja
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  // Loop tambah tahun sampai tanggal masa laku > hari ini
  while (date <= today) {
    date.setFullYear(date.getFullYear() + 1);
  }
  
  return formatTanggalJr(date);
}

/**
 * Get JR by nopol
 * Ambil data kendaraan dulu, lalu hit API JR eksternal
 */
export async function getJrByNopol(nopol: string): Promise<JrResponse | null> {
  // 1. Ambil data kendaraan dari database
  const kendaraan = await getKendaraanByNopol(nopol);
  
  if (!kendaraan) {
    return null;
  }

  // 2. Extract data yang dibutuhkan
  const golKend = String(kendaraan.kd_merek_kb).substring(0, 3); // 3 angka pertama
  const cc = kendaraan.jumlah_cc.toString();
  const kodePlat = String(kendaraan.kd_plat);
  let tglAkhirPkb = kendaraan.tg_akhir_pkb; // format YYYY-MM-DD
  
  // Validasi tanggal wajib ada
  if (!tglAkhirPkb) {
    throw new Error('Data tanggal akhir PKB tidak ditemukan untuk kendaraan ini');
  }
  
  // Kurangi 1 tahun dari tanggal akhir PKB
  const pkbDate = parseTanggal(tglAkhirPkb);
  pkbDate.setFullYear(pkbDate.getFullYear() - 1);
  tglAkhirPkb = formatTanggalJr(pkbDate).split('/').reverse().join('-'); // Convert ke YYYY-MM-DD
  
  const masaLakuYad = hitungMasaLakuYangAkanDatang(tglAkhirPkb);
  
  // Cek apakah kendaraan listrik (kode 5)
  const kendListrik = String(kendaraan.kd_merek_kb).startsWith('5') ? 'Y' : 'N';

  // 3. Build request body untuk API JR
  const requestBody: JrApiRequest = {
    APIKey: JR_CONSTANTS.API_KEY,
    Cat: JR_CONSTANTS.CAT,
    Tipe: JR_CONSTANTS.TIPE,
    Params: [
      {
        SesID: JR_CONSTANTS.SESID,
        KODE_CABANG: JR_CONSTANTS.KODE_CABANG,
        NOMOR_POLISI: kendaraan.no_polisi,
        GOL_KEND: golKend,
        KODE_PLAT: kodePlat,
        CC: cc,
        JML_BULAN_PRORATA: JR_CONSTANTS.JML_BULAN_PRORATA,
        TGL_TRANSAKSI: formatTanggalJr(new Date()),
        MASA_LAKU_LALU: formatTanggalJr(parseTanggal(tglAkhirPkb)),
        MASA_LAKU_LALU_TB: formatTanggalJr(parseTanggal(tglAkhirPkb)),
        MASA_LAKU_LALU_TB_NBD: formatTanggalJr(parseTanggal(tglAkhirPkb)),
        MASA_LAKU_YAD: masaLakuYad,
        KEND_LISTRIK: kendListrik,
      },
    ],
  };

  console.log('Request body untuk API JR:', requestBody);

  // 4. Hit API JR eksternal dengan retry mechanism
  const maxRetries = 5; // Tingkatkan ke 5x karena API sering timeout
  const baseRetryDelay = 2000; // Base delay 2 detik
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[JR API] Attempt ${attempt}/${maxRetries} - Calling ${env.URL_JR}`);
      
      // Tambahkan timeout controller dengan timeout lebih lama
      const controller = new AbortController();
      const timeoutDuration = 60000; // 60 detik timeout (naik dari 30 detik)
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      
      const startTime = Date.now();
      
      const response = await fetch(env.URL_JR, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      console.log(`[JR API] Response received in ${duration}ms`);

      // Cek status HTTP
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API JR Error Response:', errorText);
        throw new Error(`API JR mengembalikan error (${response.status}): ${errorText || response.statusText}`);
      }

      // 5. Parse JSON response
      const data = await response.json() as JrApiResponse[];

      // Validasi response
      if (!data || data.length === 0) {
        throw new Error('Response dari API JR kosong');
      }

      const jrData = data[0];

      // 6. Cek status response
      if (jrData.MODE !== 'OK') {
        throw new Error(`API JR error: ${jrData.MSG}`);
      }

      // 7. Map response ke format yang lebih friendly
      // Index 0 = Periode berjalan (tahun saat ini)
      // Index 1-4 = Tunggakan tahun lalu (mundur ke belakang)
      const result: JrResponse = {
        ref_id: jrData.JR_REF_ID,
        nopol: jrData.NOPOL,
        golongan: jrData.KODE_GOLONGAN,
        jenis: jrData.KODE_JENIS,
        tarif_per_tahun: [
          {
            keterangan: 'Periode Berjalan',
            kartu_jr: jrData.NILAI_KD_0,
            pokok_jr: jrData.NILAI_SW_0,
            denda_jr: jrData.NILAI_DD_0,
            subtotal: jrData.NILAI_KD_0 + jrData.NILAI_SW_0 + jrData.NILAI_DD_0,
          },
          {
            keterangan: 'Tunggakan 1 tahun lalu',
            kartu_jr: jrData.NILAI_KD_1,
            pokok_jr: jrData.NILAI_SW_1,
            denda_jr: jrData.NILAI_DD_1,
            subtotal: jrData.NILAI_KD_1 + jrData.NILAI_SW_1 + jrData.NILAI_DD_1,
          },
          {
            keterangan: 'Tunggakan 2 tahun lalu',
            kartu_jr: jrData.NILAI_KD_2,
            pokok_jr: jrData.NILAI_SW_2,
            denda_jr: jrData.NILAI_DD_2,
            subtotal: jrData.NILAI_KD_2 + jrData.NILAI_SW_2 + jrData.NILAI_DD_2,
          },
          {
            keterangan: 'Tunggakan 3 tahun lalu',
            kartu_jr: jrData.NILAI_KD_3,
            pokok_jr: jrData.NILAI_SW_3,
            denda_jr: jrData.NILAI_DD_3,
            subtotal: jrData.NILAI_KD_3 + jrData.NILAI_SW_3 + jrData.NILAI_DD_3,
          },
          {
            keterangan: 'Tunggakan 4 tahun lalu',
            kartu_jr: jrData.NILAI_KD_4,
            pokok_jr: jrData.NILAI_SW_4,
            denda_jr: jrData.NILAI_DD_4,
            subtotal: jrData.NILAI_KD_4 + jrData.NILAI_SW_4 + jrData.NILAI_DD_4,
          },
        ],
        total_tarif: {
          kartu_jr: jrData.NILAI_KD_0 + jrData.NILAI_KD_1 + jrData.NILAI_KD_2 + jrData.NILAI_KD_3 + jrData.NILAI_KD_4,
          pokok_jr: jrData.NILAI_SW_0 + jrData.NILAI_SW_1 + jrData.NILAI_SW_2 + jrData.NILAI_SW_3 + jrData.NILAI_SW_4,
          denda_jr: jrData.NILAI_DD_0 + jrData.NILAI_DD_1 + jrData.NILAI_DD_2 + jrData.NILAI_DD_3 + jrData.NILAI_DD_4,
          total: 
            jrData.NILAI_KD_0 + jrData.NILAI_KD_1 + jrData.NILAI_KD_2 + jrData.NILAI_KD_3 + jrData.NILAI_KD_4 +
            jrData.NILAI_SW_0 + jrData.NILAI_SW_1 + jrData.NILAI_SW_2 + jrData.NILAI_SW_3 + jrData.NILAI_SW_4 +
            jrData.NILAI_DD_0 + jrData.NILAI_DD_1 + jrData.NILAI_DD_2 + jrData.NILAI_DD_3 + jrData.NILAI_DD_4,
        },
        nilai_prorata: jrData.NILAI_PRORATA,
      };

      return result; // Success - keluar dari loop retry

    } catch (err: unknown) {
      lastError = err;
      const errorObj = err as NetworkError;
      const duration = Date.now() - (errorObj.startTime || Date.now());
      console.error(`[JR API] Attempt ${attempt}/${maxRetries} failed after ${duration}ms:`, errorObj.message);
      
      // Jika ini bukan attempt terakhir dan error bisa di-retry, tunggu sebelum retry
      const isRetryableError = 
        errorObj.name === 'AbortError' ||
        errorObj.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        errorObj.cause?.code === 'ETIMEDOUT' ||
        errorObj.cause?.code === 'ECONNRESET' ||
        errorObj.cause?.code === 'ECONNREFUSED';
      
      if (attempt < maxRetries && isRetryableError) {
        // Exponential backoff: 2s, 4s, 8s, 16s, 32s
        const currentDelay = baseRetryDelay * Math.pow(2, attempt - 1);
        console.log(`[JR API] Retrying in ${currentDelay}ms... (exponential backoff)`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        continue; // Lanjut ke attempt berikutnya
      }
      
      // Jika bukan retryable error atau sudah attempt terakhir, throw error
      break;
    }
  }

  // Jika sampai sini berarti semua retry gagal
  const error = lastError as NetworkError;
  console.error('[JR API] All retry attempts failed. Last error:', error);
  console.error('[JR API] Error cause:', error.cause);
  
  // Timeout error from AbortController
  if (error.name === 'AbortError') {
    throw new Error('Request ke API JR timeout setelah 60 detik. Server tidak merespon. Sudah dicoba 5x.');
  }
  
  // Undici connect timeout
  if (error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
    throw new Error(
      `Koneksi ke API JR timeout. Server ${env.URL_JR} tidak merespon. ` +
      'Kemungkinan: (1) Server API lambat/down, (2) Firewall blocking, (3) Network issue. ' +
      'Sudah dicoba 5x dengan exponential backoff (total ~62 detik).'
    );
  }
  
  // Network error atau timeout
  if (error.cause?.code === 'ENOTFOUND') {
    throw new Error('Domain API JR tidak ditemukan. Pastikan URL sudah benar: ' + env.URL_JR);
  }
  
  if (error.cause?.code === 'ECONNREFUSED') {
    throw new Error('Koneksi ke API JR ditolak. Server mungkin tidak aktif atau port salah. Sudah dicoba 5x.');
  }
  
  if (error.cause?.code === 'ETIMEDOUT') {
    throw new Error('Timeout saat menghubungi API JR. Server tidak merespon. Sudah dicoba 5x.');
  }
  
  if (error.cause?.code === 'ECONNRESET') {
    throw new Error('Koneksi ke API JR terputus. Server memutuskan koneksi. Sudah dicoba 5x.');
  }
  
  // SSL/TLS errors
  if (error.cause?.code === 'CERT_HAS_EXPIRED' || error.cause?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
    throw new Error('SSL Certificate API JR bermasalah. Hubungi penyedia API JR');
  }
  
  // Jika sudah error message yang jelas, langsung throw
  if (error.message && !error.message.includes('fetch failed')) {
    throw error;
  }
  
  // Generic fetch error
  throw new Error(
    'Gagal terhubung ke API JR setelah 5x percobaan dengan exponential backoff. ' +
    `Error: ${error.message}. ` +
    `Cause: ${error.cause?.code || error.cause?.message || 'Unknown'}. ` +
    `URL: ${env.URL_JR}. ` +
    'Periksa: (1) Koneksi internet, (2) URL API benar, (3) Server API aktif, (4) Firewall tidak blocking'
  );
}
