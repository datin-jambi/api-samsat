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
  nm_merek_kb: string,
  nm_model_kb: string,
  nm_jenis_kb: string,
  th_rakitan: number,
  jumlah_cc: number,
  warna_kb: string,
  tg_akhir_pkb: Date,
  kd_plat: number,
  no_polisi: string,
  kd_merek_kb: number,
  kd_bbm: string,
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
  nm_merek_kb: string,
  nm_model_kb: string,
  nm_jenis_kb: string,
  th_rakitan: number,
  jumlah_cc: number,
  warna_kb: string,
  tg_akhir_pkb: string,
  kd_plat: number,
  no_polisi: string,
  kd_merek_kb: number
}

export interface DetailKendaraanResponse {
  nm_merek_kb: string,
  nm_model_kb: string,
  nm_jenis_kb: string,
  th_rakitan: number,
  jumlah_cc: number,
  warna_kb: string,
  tg_akhir_pkb: string,
  kd_plat: number,
  no_polisi: string,
  kd_merek_kb: number,
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


