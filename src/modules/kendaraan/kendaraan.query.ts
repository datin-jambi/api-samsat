import { query, queryOne } from '../../db/postgres';
import { 
  Kendaraan,
  DetailKendaraan
} from './kendaraan.type';



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
  kd_merek_kb: string,
  th_rakitan: number
): Promise<any> {
  const sql = `
    SELECT 
      nilai_jual,
      bobot
    FROM t_trf_nj
    WHERE kd_merek_kb = $1
    AND thn = $2`;

  const result = await queryOne<any>(sql, [kd_merek_kb, th_rakitan]);
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
  const result = await queryOne<any>(sql, [kd_lokasi]);
  return result ? result.nm_lokasi : 'Lokasi tidak ditemukan';
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
 */
export async function getDetailKendaraan(
  nopol: string,
  select: string = '', 
  from: string = 't_trnkb',
  where: string = '', 
): Promise<DetailKendaraan | null> {
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
      kd_merek_kb,
      kd_lokasi,
      kd_bbm
      ${select ? ',' + select : ''}
    FROM ${from}
    WHERE UPPER(no_polisi) = UPPER($1)
    ${where ? 'AND ' + where : ''}
    LIMIT 1
  `;
  
  return queryOne<DetailKendaraan>(sql, [nopol]);
}
