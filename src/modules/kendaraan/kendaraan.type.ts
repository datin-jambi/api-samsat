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
  kd_plat: string,
  no_polisi: string,
  kd_merek_kb: string
}

export interface DetailKendaraan {
  nm_merek_kb: string,
  nm_model_kb: string,
  nm_jenis_kb: string,
  th_rakitan: number,
  jumlah_cc: number,
  warna_kb: string,
  tg_akhir_pkb: Date,
  kd_plat: string,
  no_polisi: string,
  kd_merek_kb: string,
  kd_bbm: string,
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
  tg_akhir_pkb: Date,
  kd_plat: string,
  no_polisi: string,
  kd_merek_kb: string
}

export interface DetailKendaraanResponse {
  nm_merek_kb: string,
  nm_model_kb: string,
  nm_jenis_kb: string,
  th_rakitan: number,
  jumlah_cc: number,
  warna_kb: string,
  tg_akhir_pkb: string,
  kd_plat: string,
  no_polisi: string,
  kd_merek_kb: string,
  kd_bbm: string,
  njkb: {
    nilai_jual: number,
    bobot: number,
  },
    lokasi_transaksi_terakhir: {
    kd_lokasi: string,
    nama: string,
  }
}


