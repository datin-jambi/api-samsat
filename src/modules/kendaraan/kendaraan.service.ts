import {
  getKendaraanEnrichmentData
} from './kendaraan.query';
import { 
  getKendaraanData
} from '../../shared/query/kendaraan.helper';
import { 
  KendaraanResponse,
  DetailKendaraanResponse,
  PnbpResponse
} from './kendaraan.type';
import {formatDate} from '../../utils/date.util';
import {formatRupiah} from '../../utils/number.util';
import {normalizeNopol} from '../../utils/string.util';
import {
  STNK_RENEWAL_WINDOW_DAYS,
  buildDetailKendaraanResponse,
  calculatePnbp,
  getAllKendaraanByPriority,
  getFinalStnkDate,
  mapKendaraanResponse,
  normalizeStnkDate,
} from './kendaraan.service.util';

/**
 * Get all kendaraan
 * Coba dari t_trnkb dulu, kalau tidak ada coba t_mstkb, kalau tidak ada juga coba tt_trnkb
 */
export async function getAllKendaraan(
  limit?: number
): Promise<KendaraanResponse[]> {
  const kendaraanList = await getAllKendaraanByPriority(limit);
  return kendaraanList.map(mapKendaraanResponse);
}

/**
 * Get kendaraan by nopol
 * 
 * Normalize nopol sebelum query untuk konsistensi:
 * - "BH 6869 IK" -> "BH6869IK"
 * - "bh 6869 ik" -> "BH6869IK"
 */
export async function getKendaraanByNopol(
  nopol: string
): Promise<DetailKendaraanResponse | null> {
  const kendaraan = await getKendaraanData(normalizeNopol(nopol));
  if (!kendaraan) return null;

  const enrichment = await getKendaraanEnrichmentData(
    kendaraan.kd_lokasi,
    kendaraan.kd_bbm,
    Number(kendaraan.kd_plat),
    kendaraan.kd_jenis_kb,
    kendaraan.kd_jen_milik,
    kendaraan.kd_fungsi,
    Number(kendaraan.kd_merek_kb),
    kendaraan.th_rakitan
  );

  const finalStnk = getFinalStnkDate(kendaraan);
  return buildDetailKendaraanResponse(kendaraan, enrichment, finalStnk);
}

/**
 * Get PNBP Kendaraan
 * Menghitung PNBP TNKB dan PNBP STNK
 */
export async function getPnbpKendaraan(
  nopol: string
): Promise<PnbpResponse | null> {
  const kendaraan = await getKendaraanData(normalizeNopol(nopol));
  if (!kendaraan) {
    return null;
  }

  // 2. Validasi tanggal STNK
  if (!kendaraan.tg_akhir_stnk) {
    throw new Error('Data tanggal akhir STNK tidak ditemukan');
  }

  const normalizedStnk = normalizeStnkDate(kendaraan.tg_akhir_stnk, kendaraan.tg_akhir_pkb);
  if (!normalizedStnk) {
    throw new Error('Format tanggal akhir STNK tidak valid');
  }

  const tglAkhirStnk = normalizedStnk;
  const sekarang = new Date();

  const sudahHabis = tglAkhirStnk < sekarang;
  const tahunStnk = tglAkhirStnk.getFullYear();
  const tahunSekarang = sekarang.getFullYear();
  const akanHabisTahunIni = tahunStnk === tahunSekarang;

  let hariSebelumHabis: number | null = null;
  if (!sudahHabis) {
    const selisihMs = tglAkhirStnk.getTime() - sekarang.getTime();
    hariSebelumHabis = Math.ceil(selisihMs / (1000 * 60 * 60 * 24));
  }

  const perluCetakBaru = !sudahHabis
    && hariSebelumHabis !== null
    && hariSebelumHabis <= STNK_RENEWAL_WINDOW_DAYS;

  const { pnbpTnkb, pnbpStnk, totalPnbp } = calculatePnbp(
    kendaraan.kd_jenis_kb,
    sudahHabis,
    akanHabisTahunIni,
    perluCetakBaru
  );

  const data: PnbpResponse = {
    nopol: kendaraan.no_polisi,
    kd_jenis_kb: kendaraan.kd_jenis_kb,
    tg_akhir_stnk: formatDate(tglAkhirStnk),
    pnbp: {
      stnk: {
        status: pnbpStnk > 0,
        nominal: formatRupiah(pnbpStnk)
      },
      tnkb: {
        status: pnbpTnkb > 0,
        nominal: formatRupiah(pnbpTnkb)
      },
      total: formatRupiah(totalPnbp)
    }
  };

  return data;
}
