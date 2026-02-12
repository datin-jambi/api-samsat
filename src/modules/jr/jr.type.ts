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
 * Tarif JR per periode
 * Index 0 = Periode berjalan, Index 1-4 = Tunggakan 1-4 tahun lalu
 */
export interface TarifJr {
  keterangan: string; // 'Periode Berjalan' | 'Tunggakan 1 tahun lalu' | dst
  kartu_jr: number; // NILAI_KD
  pokok_jr: number; // NILAI_SW
  denda_jr: number; // NILAI_DD
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
    kartu_jr: number;
    pokok_jr: number;
    denda_jr: number;
    total: number;
  };
  nilai_prorata: number;
}
