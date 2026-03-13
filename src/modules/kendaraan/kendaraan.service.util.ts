import {
  getAllKendaraanQuery,
  KendaraanEnrichmentData
} from './kendaraan.query';
import { updateKdKelKbByPlat } from '../../shared/query/kendaraan.helper';
import {
  Kendaraan,
  DetailKendaraan,
  KendaraanResponse,
  DetailKendaraanResponse
} from './kendaraan.type';
import { formatDate } from '../../utils/date.util';
import { formatRupiah } from '../../utils/number.util';
import { tgAkhirStnk } from '../../utils/stnk-cek';

const PRIORITY_TABLES = ['t_trnkb', 't_mstkb', 'tt_trnkb'] as const;

const PNBP_NOMINAL = {
  R2: {
    TNKB: 60000,
    STNK: 100000,
  },
  OTHER: {
    TNKB: 100000,
    STNK: 200000,
  },
} as const;

const FALLBACK_LABEL = {
  PLAT: 'Plat tidak ditemukan',
  JENIS_KENDARAAN: 'Jenis kendaraan tidak ditemukan',
  JENIS_MILIK: 'Jenis milik tidak ditemukan',
  FUNGSI_KENDARAAN: 'Fungsi kendaraan tidak ditemukan',
  BBM: 'BBM tidak ditemukan',
  LOKASI: 'Lokasi tidak ditemukan',
} as const;

export const STNK_RENEWAL_WINDOW_DAYS = 90;

export function normalizeStnkDate(
  stnkValue: Date | string | null,
  pkbValue: Date | string | null
): Date | null {
  if (stnkValue && pkbValue) {
    return tgAkhirStnk(stnkValue, pkbValue);
  }

  if (!stnkValue) {
    return null;
  }

  const parsedStnk = stnkValue instanceof Date ? stnkValue : new Date(stnkValue);
  return Number.isNaN(parsedStnk.getTime()) ? null : parsedStnk;
}

export function getFinalStnkDate(kendaraan: DetailKendaraan): Date | null {
  if (kendaraan.tg_akhir_stnk && kendaraan.tg_akhir_pkb) {
    return tgAkhirStnk(kendaraan.tg_akhir_stnk, kendaraan.tg_akhir_pkb);
  }

  if (!kendaraan.tg_akhir_stnk) {
    return null;
  }

  const parsedStnk = new Date(kendaraan.tg_akhir_stnk);
  return Number.isNaN(parsedStnk.getTime()) ? null : parsedStnk;
}

export function mapKendaraanResponse(data: Kendaraan): KendaraanResponse {
  return {
    nm_merek_kb: data.nm_merek_kb,
    nm_model_kb: data.nm_model_kb,
    nm_jenis_kb: data.nm_jenis_kb,
    th_rakitan: data.th_rakitan,
    jumlah_cc: data.jumlah_cc,
    warna_kb: data.warna_kb,
    tg_akhir_pkb: formatDate(data.tg_akhir_pkb),
    kd_plat: Number(data.kd_plat),
    no_polisi: data.no_polisi,
    kd_merek_kb: Number(data.kd_merek_kb)
  };
}

export async function getAllKendaraanByPriority(limit?: number): Promise<Kendaraan[]> {
  for (const tableName of PRIORITY_TABLES) {
    const kendaraanList = await getAllKendaraanQuery(limit, '', tableName, '');
    if (kendaraanList.length > 0) {
      return kendaraanList;
    }
  }

  return [];
}

export function buildDetailKendaraanResponse(
  kendaraan: DetailKendaraan,
  enrichment: KendaraanEnrichmentData | null,
  finalStnk: Date | null
): DetailKendaraanResponse {
  return {
    no_polisi: kendaraan.no_polisi,
    nm_model_kb: kendaraan.nm_model_kb,
    nm_jenis_kb: kendaraan.nm_jenis_kb,
    kd_kel_kb: updateKdKelKbByPlat(kendaraan.kd_plat),
    merek: {
      kode: Number(kendaraan.kd_merek_kb),
      nama: kendaraan.nm_merek_kb,
    },
    th_rakitan: kendaraan.th_rakitan,
    jumlah_cc: kendaraan.jumlah_cc,
    warna_kb: kendaraan.warna_kb,
    tg_akhir_pkb: formatDate(kendaraan.tg_akhir_pkb),
    tg_akhir_stnk: formatDate(finalStnk),
    plat: {
      kode: Number(kendaraan.kd_plat),
      nama: enrichment?.nm_plat || FALLBACK_LABEL.PLAT
    },
    jenis_kendaraan: {
      kode: kendaraan.kd_jenis_kb,
      nama: enrichment?.nm_jenis_kb || FALLBACK_LABEL.JENIS_KENDARAAN
    },
    jenis_milik: {
      kode: kendaraan.kd_jen_milik,
      nama: enrichment?.nm_jen_milik || FALLBACK_LABEL.JENIS_MILIK
    },
    fungsi_kendaraan: {
      kode: kendaraan.kd_fungsi,
      nama: enrichment?.nm_fungsi || FALLBACK_LABEL.FUNGSI_KENDARAAN
    },
    bbm: {
      kode: Number(kendaraan.kd_bbm),
      nama: enrichment?.nm_bbm || FALLBACK_LABEL.BBM
    },
    njkb: {
      nilai_jual: formatRupiah(Math.round(enrichment?.nilai_jual || 0)),
      bobot: Number(enrichment?.bobot || 0)
    },
    lokasi_transaksi_terakhir: {
      kd_lokasi: kendaraan.kd_lokasi,
      nama: enrichment?.nm_lokasi || FALLBACK_LABEL.LOKASI
    }
  };
}

export function calculatePnbp(
  kdJenisKb: string,
  sudahHabis: boolean,
  akanHabisTahunIni: boolean,
  perluCetakBaru: boolean
): { pnbpTnkb: number; pnbpStnk: number; totalPnbp: number } {
  const isRodaDua = kdJenisKb === 'R';
  const nominal = isRodaDua ? PNBP_NOMINAL.R2 : PNBP_NOMINAL.OTHER;
  const hitungPnbpTnkb = sudahHabis || akanHabisTahunIni;

  const pnbpTnkb = hitungPnbpTnkb ? nominal.TNKB : 0;
  const pnbpStnk = hitungPnbpTnkb && (sudahHabis || perluCetakBaru) ? nominal.STNK : 0;

  return {
    pnbpTnkb,
    pnbpStnk,
    totalPnbp: pnbpTnkb + pnbpStnk
  };
}
