/**
 * Kendaraan Types
 * 
 * Interface untuk typing data kendaraan
 */

/**
 * Data kendaraan dari database
 */
export interface Kendaraan {
  nm_merek_kb: string,
  nm_model_kb: string,
  nm_jenis_kb: string,
  th_rakitan: number,
  jumlah_cc: number,
  warna_kb: string,
  tg_akhir_pkb: Date,
  kd_plat: number,
  no_polisi: string,
  kd_merek_kb: number
}

export interface DetailKendaraan {
  no_polisi: string,
  nm_model_kb: string,
  nm_jenis_kb: string,
  kd_kel_kb: string,
  nm_merek_kb: string,
  th_rakitan: number,
  jumlah_cc: number,
  warna_kb: string,
  tg_akhir_pkb: Date | null,
  tg_akhir_stnk: Date | null,
  kd_plat: number,
  kd_merek_kb: number,
  kd_bbm: string,
  kd_jenis_kb: string,
  kd_jen_milik: string,
  kd_fungsi: string,
  bbm: {
    kode: number,
    nama: string,
  },
  kd_lokasi: string
}

/**
 * Response data kendaraan (setelah diolah)
 */
export interface KendaraanResponse {
  no_polisi: string,
  nm_merek_kb: string,
  nm_model_kb: string,
  nm_jenis_kb: string,
  th_rakitan: number,
  jumlah_cc: number,
  warna_kb: string,
  tg_akhir_pkb: string | null,
  kd_plat: number,
  kd_merek_kb: number
}

export interface DetailKendaraanResponse {
  no_polisi: string,
  nm_model_kb: string,
  nm_jenis_kb: string,
  kd_kel_kb: string,
  merek: {
    kode: number,
    nama: string,
  },
  th_rakitan: number,
  jumlah_cc: number,
  warna_kb: string,
  tg_akhir_pkb: string | null,
  tg_akhir_stnk: string | null,

  plat: {
    kode: number,
    nama: string | null | undefined,
  },
  jenis_kendaraan:{
    kode: string,
    nama: string,
  },
  jenis_milik:{
    kode: string,
    nama: string,
  },
  fungsi_kendaraan:{
    kode: string,
    nama: string,
  },
  bbm: {
    kode: number,
    nama: string,
  },
  njkb: {
    nilai_jual: string,
    bobot: number,
  },
  lokasi_transaksi_terakhir: {
    kd_lokasi: string,
    nama: string,
  }
}

export interface PnbpResponse {
  nopol: string,
  kd_jenis_kb: string,
  tg_akhir_stnk: string | null,
  pnbp: {
    stnk: {
      status: boolean,
      nominal: string
    },
    tnkb: {
      status: boolean,
      nominal: string
    },
    total: string
  }
}


