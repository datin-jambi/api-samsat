import {
  getAllKendaraanQuery,
  getDetailKendaraan,
  getNjkbKendaraanQuery,
  getLokasiTransaksiTerakhirKendaraan,
  getNamaBbm
} from './kendaraan.query';
import { 
  KendaraanResponse,
  DetailKendaraanResponse,
  PnbpResponse
} from './kendaraan.type';
import {formatDate} from '../../utils/date.util';
import {formatRupiah} from '../../utils/number.util';

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
    tg_akhir_pkb: formatDate(data.tg_akhir_pkb),
    kd_plat: Number(data.kd_plat),
    no_polisi: data.no_polisi,
    kd_merek_kb: Number(data.kd_merek_kb)
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
  const ceknamaBbm = await getNamaBbm(kendaraan.kd_bbm);

  const data: DetailKendaraanResponse = {
    nm_merek_kb: kendaraan.nm_merek_kb,
    nm_model_kb: kendaraan.nm_model_kb,
    nm_jenis_kb: kendaraan.nm_jenis_kb,
    th_rakitan: kendaraan.th_rakitan,
    jumlah_cc: kendaraan.jumlah_cc,
    warna_kb: kendaraan.warna_kb,
    tg_akhir_pkb: formatDate(kendaraan.tg_akhir_pkb),
    tg_akhir_stnk: formatDate(kendaraan.tg_akhir_stnk),
    kd_jenis_kb: kendaraan.kd_jenis_kb,
    kd_plat: Number(kendaraan.kd_plat),
    no_polisi: kendaraan.no_polisi,
    kd_merek_kb: Number(kendaraan.kd_merek_kb),
    bbm: {
      kode: Number(kendaraan.kd_bbm),
      nama: ceknamaBbm || 'BBM tidak ditemukan'
    },
    njkb: {
      nilai_jual: formatRupiah(Math.round(cekNjkb?.nilai_jual || 0)),
      bobot: Number(cekNjkb?.bobot || 0)
    },
    lokasi_transaksi_terakhir: {
      kd_lokasi: kendaraan.kd_lokasi,
      nama: lokasiTransaksiTerakhir || 'Lokasi tidak ditemukan'
    }
  };

  return data;
}

/**
 * Get PNBP Kendaraan
 * Menghitung PNBP TNKB dan PNBP STNK
 */
export async function getPnbpKendaraan(
  nopol: string
): Promise<PnbpResponse | null> {
  // 1. Ambil data kendaraan
  let kendaraan = await getDetailKendaraan(nopol, '', 't_trnkb', '');
  
  if (!kendaraan) {
    kendaraan = await getDetailKendaraan(nopol, '', 't_mstkb', '');
  }
  
  if (!kendaraan) {
    kendaraan = await getDetailKendaraan(nopol, '', 'tt_trnkb', '');
  }
  
  if (!kendaraan) {
    return null;
  }

  // 2. Validasi tanggal STNK
  if (!kendaraan.tg_akhir_stnk) {
    throw new Error('Data tanggal akhir STNK tidak ditemukan');
  }

  const tglAkhirStnk = new Date(kendaraan.tg_akhir_stnk);
  const sekarang = new Date();
  
  // 3. Hitung status STNK
  const sudahHabis = tglAkhirStnk < sekarang;
  const tahunStnk = tglAkhirStnk.getFullYear();
  const tahunSekarang = sekarang.getFullYear();
  const akanHabisTahunIni = tahunStnk === tahunSekarang;
  
  // Hitung hari sebelum habis (null jika sudah habis)
  let hariSebelumHabis: number | null = null;
  if (!sudahHabis) {
    const selisihMs = tglAkhirStnk.getTime() - sekarang.getTime();
    hariSebelumHabis = Math.ceil(selisihMs / (1000 * 60 * 60 * 24));
  }
  
  // Perlu cetak STNK baru jika dalam 90 hari sebelum habis
  const perluCetakBaru = !sudahHabis && hariSebelumHabis !== null && hariSebelumHabis <= 90;
  
  // 4. Hitung PNBP TNKB
  const perlitunganPnbpTnkb = sudahHabis || akanHabisTahunIni;
  let pnbpTnkb = 0;
  
  if (perlitunganPnbpTnkb) {
    // Roda 2 (kd_jenis_kb == "R") = 60000
    // Roda 4 (lainnya) = 100000
    pnbpTnkb = kendaraan.kd_jenis_kb === 'R' ? 60000 : 100000;
  }
  
  // 5. Hitung PNBP STNK
  let pnbpStnk = 0;
  
  if (perlitunganPnbpTnkb && (sudahHabis || perluCetakBaru)) {
    pnbpStnk = 200000;
  }
  
  // 6. Total PNBP
  const totalPnbp = pnbpTnkb + pnbpStnk;
  
  // 7. Susun response
  const data: PnbpResponse = {
    nopol: kendaraan.no_polisi,
    kd_jenis_kb: kendaraan.kd_jenis_kb,
    tg_akhir_stnk: formatDate(tglAkhirStnk),
    pnbp_tnkb: formatRupiah(pnbpTnkb),
    pnbp_stnk: formatRupiah(pnbpStnk),
    total_pnbp: formatRupiah(totalPnbp)
  };

  return data;
}
