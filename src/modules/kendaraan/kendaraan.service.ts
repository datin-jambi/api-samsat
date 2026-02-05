import {
  getAllKendaraanQuery,
  getDetailKendaraan,
  getNjkbKendaraanQuery,
  getLokasiTransaksiTerakhirKendaraan
} from './kendaraan.query';
import { 
  KendaraanResponse,
  DetailKendaraanResponse
} from './kendaraan.type';
import {formatDate} from '../../utils/date.util';

/**
 * Get all kendaraan
 * Coba dari t_trnkb dulu, kalau tidak ada coba t_mstkb, kalau tidak ada juga coba tt_trnkb
 */
export async function getAllKendaraan(
  limit?: number
): Promise<KendaraanResponse[]> {
  // Coba dari t_trnkb dulu
  let kendaraanList = await getAllKendaraanQuery(
    limit, 
    '',
    't_trnkb', 
    ''
  );
  
  // Kalau tidak ada, coba dari t_mstkb
  if (kendaraanList.length === 0) {
    kendaraanList = await getAllKendaraanQuery(
      limit, 
      '',
      't_mstkb', 
      ''
    );
  }
  
  // Kalau masih tidak ada, coba dari tt_trnkb
  if (kendaraanList.length === 0) {
    kendaraanList = await getAllKendaraanQuery(
      limit, 
      '',
      'tt_trnkb', 
      ''
    );
  }

  const data = kendaraanList.map(data => ({
    nm_merek_kb: data.nm_merek_kb,
    nm_model_kb: data.nm_model_kb,
    nm_jenis_kb: data.nm_jenis_kb,
    th_rakitan: data.th_rakitan,
    jumlah_cc: data.jumlah_cc,
    warna_kb: data.warna_kb,
    tg_akhir_pkb: data.tg_akhir_pkb,
    kd_plat: data.kd_plat,
    no_polisi: data.no_polisi,
    kd_merek_kb: data.kd_merek_kb
  }));

  return data;

}

/**
 * Get kendaraan by nopol
 */
export async function getKendaraanByNopol(
  nopol: string
): Promise<DetailKendaraanResponse | null> {
  let kendaraan = await getDetailKendaraan(
    nopol,
    '',
    't_trnkb',
    ''
  );
  // Kalau tidak ada, coba dari t_mstkb
  if (!kendaraan) {
    kendaraan = await getDetailKendaraan(
      nopol,
      '',
      't_mstkb',
      ''
    );
  }

  // Kalau masih tidak ada, coba dari tt_trnkb
  if (!kendaraan) {
    kendaraan = await getDetailKendaraan(
      nopol,
      '',
      'tt_trnkb',
      ''
    );
  }
  
  if (!kendaraan) {
    return null;
  }

  const lokasiTransaksiTerakhir = await getLokasiTransaksiTerakhirKendaraan(kendaraan.kd_lokasi);

  const cekNjkb = await getNjkbKendaraanQuery(kendaraan.kd_merek_kb, kendaraan.th_rakitan);

  const data: DetailKendaraanResponse = {
    nm_merek_kb: kendaraan.nm_merek_kb,
    nm_model_kb: kendaraan.nm_model_kb,
    nm_jenis_kb: kendaraan.nm_jenis_kb,
    th_rakitan: kendaraan.th_rakitan,
    jumlah_cc: kendaraan.jumlah_cc,
    warna_kb: kendaraan.warna_kb,
    tg_akhir_pkb: formatDate(kendaraan.tg_akhir_pkb),
    kd_plat: kendaraan.kd_plat,
    no_polisi: kendaraan.no_polisi,
    kd_merek_kb: kendaraan.kd_merek_kb,
    kd_bbm: kendaraan.kd_bbm,
    njkb: {
      nilai_jual: cekNjkb?.nilai_jual || 0,
      bobot: cekNjkb?.bobot || 0
    },
    lokasi_transaksi_terakhir: {
      kd_lokasi: kendaraan.kd_lokasi,
      nama: lokasiTransaksiTerakhir || 'Lokasi tidak ditemukan'
    }
  };

  return data;
}

