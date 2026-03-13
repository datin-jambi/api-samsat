import { query, queryOne } from '../../db/postgres';
import { 
  Kendaraan,
  DetailKendaraan
} from './kendaraan.type';

export interface KendaraanEnrichmentData {
  nm_lokasi: string | null;
  nm_bbm: string | null;
  nm_plat: string | null;
  nm_jenis_kb: string | null;
  nm_jen_milik: string | null;
  nm_fungsi: string | null;
  nilai_jual: number | null;
  bobot: number | null;
}

interface NjkbRow {
  nilai_jual: number;
  bobot: number;
}

interface LokasiRow {
  nm_lokasi: string;
}

interface BbmRow {
  nm_bbm: string;
}

interface PlatRow {
  nm_plat: string;
}

interface JenisKbRow {
  nm_jenis_kb: string;
}

interface JenisMilikRow {
  nm_jen_milik: string;
}

interface FungsiKbRow {
  nm_fungsi: string;
}



/**
 * Kendaraan Query
 * 
 * Semua SQL query untuk module kendaraan
 * Query mentah menggunakan library pg
 */

/**
 * Helper Query
 */
// Get NJKB kendaraan
export async function getNjkbKendaraanQuery(
  kd_merek_kb: number,
  th_rakitan: number
): Promise<NjkbRow | null> {
  const sql = `
    SELECT 
      nilai_jual,
      bobot
    FROM t_trf_nj
    WHERE kd_merek_kb = $1
    AND thn = $2`;

  const result = await queryOne<NjkbRow>(sql, [kd_merek_kb, th_rakitan]);
  return result;
}

// nama lokasi terakhir transaksi kendaraan
export async function getLokasiTransaksiTerakhirKendaraan(
  kd_lokasi: string
): Promise<string> {
  const sql = `
    SELECT 
      nm_lokasi
    FROM t_nm_lokasi
    WHERE kd_lokasi = $1
    LIMIT 1`;
  const result = await queryOne<LokasiRow>(sql, [kd_lokasi]);
  return result ? result.nm_lokasi : 'Lokasi tidak ditemukan';
}

export async function getNamaBbm(
  kd_bbm: string
): Promise<string> {
  const sql = `
    SELECT 
      nm_bbm
    FROM t_bbm
    WHERE kd_bbm = $1
    LIMIT 1`;
  const result = await queryOne<BbmRow>(sql, [kd_bbm]);
  return result ? result.nm_bbm : 'BBM tidak ditemukan';
}


/**
 * Get semua kendaraan dengan limit
 */
export async function getAllKendaraanQuery(
  limit: number = 100, 
  select: string = '', 
  from: string = 't_trnkb',
  where: string = '', 
): Promise<Kendaraan[]> {
  const sql = `
    SELECT 
      nm_merek_kb,
      nm_model_kb,
      nm_jenis_kb,
      th_rakitan,
      jumlah_cc,
      warna_kb,
      tg_akhir_pkb,
      kd_plat,
      no_polisi,
      kd_merek_kb
      ${select ? ',' + select : ''}
    FROM ${from}
    ${where ? 'WHERE tg_bayar > \'1990-01-01\' AND ' + where : 'WHERE tg_bayar > \'1990-01-01\''}
    ORDER BY tg_bayar DESC, no_urut_trn DESC
    LIMIT $1
  `;
  
  return query<Kendaraan>(sql, [limit]);
}

/**
 * Get kendaraan by nopol
 * 
 * Query ini handle normalisasi nopol:
 * - Hapus semua spasi di database (REPLACE)
 * - Convert ke uppercase (UPPER)
 * - Compare dengan input yang sudah dinormalisasi
 * 
 * Mengambil record dengan tg_bayar terbaru terlebih dahulu
 */
export async function getDetailKendaraan(
  nopol: string,
  select: string = '', 
  from: string = 't_trnkb',
  where: string = '', 
): Promise<DetailKendaraan | null> {
  const sql = `
    SELECT 
      no_polisi,
      kd_merek_kb,
      nm_merek_kb,
      nm_model_kb,
      nm_jenis_kb,
      th_rakitan,
      jumlah_cc,
      warna_kb,
      tg_akhir_pkb,
      tg_akhir_stnk,
      kd_lokasi,
      kd_bbm,
      kd_kel_kb,

      kd_plat,
      kd_jenis_kb,

      kd_jen_milik,
      kd_fungsi
      ${select ? ',' + select : ''}
    FROM ${from}
    WHERE UPPER(REPLACE(no_polisi, ' ', '')) = UPPER(REPLACE($1, ' ', ''))
    ${where ? 'AND ' + where : ''}
    ORDER BY tg_bayar DESC, no_urut_trn DESC
    LIMIT 1
  `;
  
  return queryOne<DetailKendaraan>(sql, [nopol]);
}

/**
 * Get kendaraan by nopol dari 3 tabel sekaligus dalam 1 query.
 * Urutan prioritas: t_trnkb -> t_mstkb -> tt_trnkb
 */
export async function getDetailKendaraanFromAllTables(
  nopol: string
): Promise<DetailKendaraan | null> {
  const sql = `
    SELECT
      no_polisi,
      kd_merek_kb,
      nm_merek_kb,
      nm_model_kb,
      nm_jenis_kb,
      th_rakitan,
      jumlah_cc,
      warna_kb,
      tg_akhir_pkb,
      tg_akhir_stnk,
      kd_lokasi,
      kd_bbm,
      kd_kel_kb,
      kd_plat,
      kd_jenis_kb,
      kd_jen_milik,
      kd_fungsi
    FROM (
      SELECT
        1 AS source_priority,
        no_polisi,
        kd_merek_kb,
        nm_merek_kb,
        nm_model_kb,
        nm_jenis_kb,
        th_rakitan,
        jumlah_cc,
        warna_kb,
        tg_akhir_pkb,
        tg_akhir_stnk,
        kd_lokasi,
        kd_bbm,
        kd_kel_kb,
        kd_plat,
        kd_jenis_kb,
        kd_jen_milik,
        kd_fungsi,
        tg_bayar,
        no_urut_trn
      FROM t_trnkb
      WHERE UPPER(REPLACE(no_polisi, ' ', '')) = UPPER(REPLACE($1, ' ', ''))

      UNION ALL

      SELECT
        2 AS source_priority,
        no_polisi,
        kd_merek_kb,
        nm_merek_kb,
        nm_model_kb,
        nm_jenis_kb,
        th_rakitan,
        jumlah_cc,
        warna_kb,
        tg_akhir_pkb,
        tg_akhir_stnk,
        kd_lokasi,
        kd_bbm,
        kd_kel_kb,
        kd_plat,
        kd_jenis_kb,
        kd_jen_milik,
        kd_fungsi,
        tg_bayar,
        no_urut_trn
      FROM t_mstkb
      WHERE UPPER(REPLACE(no_polisi, ' ', '')) = UPPER(REPLACE($1, ' ', ''))

      UNION ALL

      SELECT
        3 AS source_priority,
        no_polisi,
        kd_merek_kb,
        nm_merek_kb,
        nm_model_kb,
        nm_jenis_kb,
        th_rakitan,
        jumlah_cc,
        warna_kb,
        tg_akhir_pkb,
        tg_akhir_stnk,
        kd_lokasi,
        kd_bbm,
        kd_kel_kb,
        kd_plat,
        kd_jenis_kb,
        kd_jen_milik,
        kd_fungsi,
        tg_bayar,
        no_urut_trn
      FROM tt_trnkb
      WHERE UPPER(REPLACE(no_polisi, ' ', '')) = UPPER(REPLACE($1, ' ', ''))
    ) AS kb
    ORDER BY source_priority, tg_bayar DESC, no_urut_trn DESC
    LIMIT 1
  `;

  return queryOne<DetailKendaraan>(sql, [nopol]);
}

/**
 * Ambil data master/reference kendaraan dalam 1 round-trip query.
 */
export async function getKendaraanEnrichmentData(
  kdLokasi: string,
  kdBbm: string,
  kdPlat: number,
  kdJenisKb: string,
  kdJenMilik: string,
  kdFungsi: string,
  kdMerekKb: number,
  thRakitan: number
): Promise<KendaraanEnrichmentData | null> {
  const sql = `
    SELECT
      (SELECT nm_lokasi FROM t_nm_lokasi WHERE kd_lokasi = $1 LIMIT 1) AS nm_lokasi,
      (SELECT nm_bbm FROM t_bbm WHERE kd_bbm = $2 LIMIT 1) AS nm_bbm,
      (SELECT nm_plat FROM t_plat WHERE kd_plat = $3 LIMIT 1) AS nm_plat,
      (SELECT nm_jenis_kb FROM t_jeniskb WHERE kd_jenis_kb = $4 LIMIT 1) AS nm_jenis_kb,
      (SELECT nm_jen_milik FROM t_jen_milik WHERE kd_jen_milik = $5 LIMIT 1) AS nm_jen_milik,
      (SELECT nm_fungsi FROM t_fungsikb WHERE kd_fungsi = $6 LIMIT 1) AS nm_fungsi,
      (SELECT nilai_jual FROM t_trf_nj WHERE kd_merek_kb = $7 AND thn = $8 LIMIT 1) AS nilai_jual,
      (SELECT bobot FROM t_trf_nj WHERE kd_merek_kb = $7 AND thn = $8 LIMIT 1) AS bobot
  `;

  return queryOne<KendaraanEnrichmentData>(sql, [
    kdLokasi,
    kdBbm,
    kdPlat,
    kdJenisKb,
    kdJenMilik,
    kdFungsi,
    kdMerekKb,
    thRakitan,
  ]);
}

export async function getWarnaPlat(
  kd_plat: number
): Promise<string> {
  const sql = `
    SELECT 
      nm_plat
    FROM t_plat
    WHERE kd_plat = $1
    LIMIT 1`;
  const result = await queryOne<PlatRow>(sql, [kd_plat]);
  return result ? result.nm_plat : 'Plat tidak ditemukan';
}

export async function getJenisKendaraan(
  kd_jenis_kb: string
): Promise<string> {
  const sql = `
    SELECT 
      nm_jenis_kb
    FROM t_jeniskb
    WHERE kd_jenis_kb = $1
    LIMIT 1`;
  const result = await queryOne<JenisKbRow>(sql, [kd_jenis_kb]);
  return result ? result.nm_jenis_kb : 'Jenis kendaraan tidak ditemukan';
}

export async function getJenisMilik(
  kd_jen_milik: string
): Promise<string> {
  const sql = `
    SELECT 
      nm_jen_milik
    FROM t_jen_milik
    WHERE kd_jen_milik = $1
    LIMIT 1`;
  const result = await queryOne<JenisMilikRow>(sql, [kd_jen_milik]);
  return result ? result.nm_jen_milik : 'Jenis milik tidak ditemukan';
}

export async function getFungsiKendaraan(
  kd_fungsi: string
): Promise<string> {
  const sql = `
    SELECT 
      nm_fungsi
    FROM t_fungsikb
    WHERE kd_fungsi = $1
    LIMIT 1`;
  const result = await queryOne<FungsiKbRow>(sql, [kd_fungsi]);
  return result ? result.nm_fungsi : 'Fungsi kendaraan tidak ditemukan';
}