import { env } from '../../config/env';
import { getKendaraanByNopol } from '../kendaraan/kendaraan.service';
import { JrApiRequest, JrApiResponse, JrResponse } from './jr.type';

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
  const tglAkhirPkb = kendaraan.tg_akhir_pkb; // format YYYY-MM-DD
  
  // Validasi tanggal wajib ada
  if (!tglAkhirPkb) {
    throw new Error('Data tanggal akhir PKB tidak ditemukan untuk kendaraan ini');
  }
  
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

  // 4. Hit API JR eksternal dengan retry mechanism
  const maxRetries = 3;
  const retryDelay = 2000; // 2 detik
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Tambahkan timeout controller  
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout
      
      const response = await fetch(env.URL_JR, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
        clearTimeout(timeoutId);

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
      const result: JrResponse = {
        ref_id: jrData.JR_REF_ID,
        nopol: jrData.NOPOL,
        golongan: jrData.KODE_GOLONGAN,
        jenis: jrData.KODE_JENIS,
        tarif_per_tahun: [
          {
            tahun: 1,
            kecelakaan_diri: jrData.NILAI_KD_0,
            santunan_wafat: jrData.NILAI_SW_0,
            dana_derma: jrData.NILAI_DD_0,
            subtotal: jrData.NILAI_KD_0 + jrData.NILAI_SW_0 + jrData.NILAI_DD_0,
          },
          {
            tahun: 2,
            kecelakaan_diri: jrData.NILAI_KD_1,
            santunan_wafat: jrData.NILAI_SW_1,
            dana_derma: jrData.NILAI_DD_1,
            subtotal: jrData.NILAI_KD_1 + jrData.NILAI_SW_1 + jrData.NILAI_DD_1,
          },
          {
            tahun: 3,
            kecelakaan_diri: jrData.NILAI_KD_2,
            santunan_wafat: jrData.NILAI_SW_2,
            dana_derma: jrData.NILAI_DD_2,
            subtotal: jrData.NILAI_KD_2 + jrData.NILAI_SW_2 + jrData.NILAI_DD_2,
          },
          {
            tahun: 4,
            kecelakaan_diri: jrData.NILAI_KD_3,
            santunan_wafat: jrData.NILAI_SW_3,
            dana_derma: jrData.NILAI_DD_3,
            subtotal: jrData.NILAI_KD_3 + jrData.NILAI_SW_3 + jrData.NILAI_DD_3,
          },
          {
            tahun: 5,
            kecelakaan_diri: jrData.NILAI_KD_4,
            santunan_wafat: jrData.NILAI_SW_4,
            dana_derma: jrData.NILAI_DD_4,
            subtotal: jrData.NILAI_KD_4 + jrData.NILAI_SW_4 + jrData.NILAI_DD_4,
          },
        ],
        total_tarif: {
          kecelakaan_diri: jrData.NILAI_KD_0 + jrData.NILAI_KD_1 + jrData.NILAI_KD_2 + jrData.NILAI_KD_3 + jrData.NILAI_KD_4,
          santunan_wafat: jrData.NILAI_SW_0 + jrData.NILAI_SW_1 + jrData.NILAI_SW_2 + jrData.NILAI_SW_3 + jrData.NILAI_SW_4,
          dana_derma: jrData.NILAI_DD_0 + jrData.NILAI_DD_1 + jrData.NILAI_DD_2 + jrData.NILAI_DD_3 + jrData.NILAI_DD_4,
          total: 
            jrData.NILAI_KD_0 + jrData.NILAI_KD_1 + jrData.NILAI_KD_2 + jrData.NILAI_KD_3 + jrData.NILAI_KD_4 +
            jrData.NILAI_SW_0 + jrData.NILAI_SW_1 + jrData.NILAI_SW_2 + jrData.NILAI_SW_3 + jrData.NILAI_SW_4 +
            jrData.NILAI_DD_0 + jrData.NILAI_DD_1 + jrData.NILAI_DD_2 + jrData.NILAI_DD_3 + jrData.NILAI_DD_4,
        },
        nilai_prorata: jrData.NILAI_PRORATA,
      };

      return result; // Success - keluar dari loop retry

    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      // Jika ini bukan attempt terakhir dan error bisa di-retry, tunggu sebelum retry
      const isRetryableError = 
        error.name === 'AbortError' ||
        error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        error.cause?.code === 'ETIMEDOUT' ||
        error.cause?.code === 'ECONNRESET' ||
        error.cause?.code === 'ECONNREFUSED';
      
      if (attempt < maxRetries && isRetryableError) {
        console.log(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue; // Lanjut ke attempt berikutnya
      }
      
      // Jika bukan retryable error atau sudah attempt terakhir, throw error
      break;
    }
  }

  // Jika sampai sini berarti semua retry gagal
  const error = lastError;
  console.error('All retry attempts failed. Last error:', error);
  console.error('Error cause:', error.cause);
  
  // Timeout error from AbortController
  if (error.name === 'AbortError') {
    throw new Error('Request ke API JR timeout setelah 30 detik. Server tidak merespon. Sudah dicoba 3x.');
  }
  
  // Undici connect timeout
  if (error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
    throw new Error(
      `Koneksi ke API JR timeout. Server ${env.URL_JR} tidak merespon. ` +
      'Kemungkinan: (1) Server API lambat/down, (2) Firewall blocking, (3) Network issue. ' +
      'Sudah dicoba 3x dengan delay.'
    );
  }
  
  // Network error atau timeout
  if (error.cause?.code === 'ENOTFOUND') {
    throw new Error('Domain API JR tidak ditemukan. Pastikan URL sudah benar: ' + env.URL_JR);
  }
  
  if (error.cause?.code === 'ECONNREFUSED') {
    throw new Error('Koneksi ke API JR ditolak. Server mungkin tidak aktif atau port salah. Sudah dicoba 3x.');
  }
  
  if (error.cause?.code === 'ETIMEDOUT') {
    throw new Error('Timeout saat menghubungi API JR. Server tidak merespon. Sudah dicoba 3x.');
  }
  
  if (error.cause?.code === 'ECONNRESET') {
    throw new Error('Koneksi ke API JR terputus. Server memutuskan koneksi. Sudah dicoba 3x.');
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
    'Gagal terhubung ke API JR setelah 3x percobaan. ' +
    `Error: ${error.message}. ` +
    `Cause: ${error.cause?.code || error.cause?.message || 'Unknown'}. ` +
    `URL: ${env.URL_JR}. ` +
    'Periksa: (1) Koneksi internet, (2) URL API benar, (3) Server API aktif, (4) Firewall tidak blocking'
  );
}
