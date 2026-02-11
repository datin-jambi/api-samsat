/**
 * Request body untuk API JR Eksternal
 */
export interface JrApiRequestParams {
  SesID: string;
  KODE_CABANG: string;
  NOMOR_POLISI: string;
  GOL_KEND: string;
  KODE_PLAT: string;
  CC: string;
  JML_BULAN_PRORATA: string;
  TGL_TRANSAKSI: string;
  MASA_LAKU_LALU: string;
  MASA_LAKU_LALU_TB: string;
  MASA_LAKU_LALU_TB_NBD: string;
  MASA_LAKU_YAD: string;
  KEND_LISTRIK: string;
}

export interface JrApiRequest {
  APIKey: string;
  Cat: string;
  Tipe: string;
  Params: JrApiRequestParams[];
}

/**
 * Response dari API JR Eksternal
 */
export interface JrApiResponse {
  SESSID: string;
  MSG: string;
  MODE: string;
  JR_REF_ID: string;
  NOPOL: string;
  KODE_GOLONGAN: string;
  KODE_JENIS: string;
  KODE_PLAT_JR: string;
  NILAI_KD_0: number;
  NILAI_SW_0: number;
  NILAI_DD_0: number;
  NILAI_KD_1: number;
  NILAI_SW_1: number;
  NILAI_DD_1: number;
  NILAI_KD_2: number;
  NILAI_SW_2: number;
  NILAI_DD_2: number;
  NILAI_KD_3: number;
  NILAI_SW_3: number;
  NILAI_DD_3: number;
  NILAI_KD_4: number;
  NILAI_SW_4: number;
  NILAI_DD_4: number;
  NILAI_PRORATA: number;
  OTORISASI_IWKBU: string;
}

/**
 * Tarif JR per tahun
 */
export interface TarifJr {
  tahun: number;
  kecelakaan_diri: number;
  santunan_wafat: number;
  dana_derma: number;
  subtotal: number;
}

/**
 * Response untuk client (simplified)
 */
export interface JrResponse {
  ref_id: string;
  nopol: string;
  golongan: string;
  jenis: string;
  tarif_per_tahun: TarifJr[];
  total_tarif: {
    kecelakaan_diri: number;
    santunan_wafat: number;
    dana_derma: number;
    total: number;
  };
  nilai_prorata: number;
}
