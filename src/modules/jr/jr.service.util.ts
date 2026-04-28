import { getKendaraanData } from '../../shared/query/kendaraan.helper';
import { normalizeNopol } from '../../utils/string.util';
import { JrApiRequest, JrApiResponse, JrResponse, TarifJr } from './jr.type';

export interface JrKendaraanData {
  no_polisi: string;
  kd_merek_kb: number;
  jumlah_cc: number;
  kd_plat: number;
  tg_akhir_pkb: Date | null;
}

export const JR_CONSTANTS = {
  API_KEY: 'Y6SpAZqD8o',
  CAT: 'SW_CHECK_TARIF',
  TIPE: 'getData',
  SESID: 'JAMBI-002',
  KODE_CABANG: '21',
  JML_BULAN_PRORATA: '0',
  MAX_RETRIES: 2,
  BASE_RETRY_DELAY_MS: 1000,
  REQUEST_TIMEOUT_MS: 15000,
} as const;

const TARIF_LABELS = [
  'Periode Berjalan',
  'Tunggakan 1 tahun lalu',
  'Tunggakan 2 tahun lalu',
  'Tunggakan 3 tahun lalu',
  'Tunggakan 4 tahun lalu',
] as const;

export async function getJrKendaraanData(
  nopol: string
): Promise<JrKendaraanData | null> {
  const kendaraan = await getKendaraanData(normalizeNopol(nopol));
  if (!kendaraan) {
    return null;
  }

  return {
    no_polisi: kendaraan.no_polisi,
    kd_merek_kb: Number(kendaraan.kd_merek_kb),
    jumlah_cc: kendaraan.jumlah_cc,
    kd_plat: Number(kendaraan.kd_plat),
    tg_akhir_pkb: kendaraan.tg_akhir_pkb,
  };
}

export function formatTanggalJr(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function hitungMasaLakuYangAkanDatang(date: Date): string {
  const masaLaku = new Date(date);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  masaLaku.setHours(0, 0, 0, 0);

  while (masaLaku <= today) {
    masaLaku.setFullYear(masaLaku.getFullYear() + 1);
  }

  // Tambah 1 tahun lagi setelah loop
  masaLaku.setFullYear(masaLaku.getFullYear() + 1);

  return formatTanggalJr(masaLaku);
}

export function buildJrRequestBody(kendaraan: JrKendaraanData): JrApiRequest {
  if (!kendaraan.tg_akhir_pkb) {
    throw new Error('Data tanggal akhir PKB tidak ditemukan untuk kendaraan ini');
  }

  const masaLakuLaluDate = new Date(kendaraan.tg_akhir_pkb);
  if (Number.isNaN(masaLakuLaluDate.getTime())) {
    throw new Error('Format tanggal akhir PKB tidak valid');
  }

  // MASA_LAKU_LALU = tg_akhir_pkb + 1 tahun
  masaLakuLaluDate.setFullYear(masaLakuLaluDate.getFullYear() + 1);
  const masaLakuLalu = formatTanggalJr(masaLakuLaluDate);


  const masaLakuYad = hitungMasaLakuYangAkanDatang(masaLakuLaluDate);
  const kodeMerek = String(kendaraan.kd_merek_kb);

  console.log("==============JR==============")
  console.log({ masaLakuLaluDate, masaLakuLalu, masaLakuYad })
  console.log("==============JR==============")

  return {
    APIKey: JR_CONSTANTS.API_KEY,
    Cat: JR_CONSTANTS.CAT,
    Tipe: JR_CONSTANTS.TIPE,
    Params: [
      {
        SesID: JR_CONSTANTS.SESID,
        KODE_CABANG: JR_CONSTANTS.KODE_CABANG,
        NOMOR_POLISI: kendaraan.no_polisi,
        GOL_KEND: kodeMerek.substring(0, 3),
        KODE_PLAT: String(kendaraan.kd_plat),
        CC: String(kendaraan.jumlah_cc),
        JML_BULAN_PRORATA: JR_CONSTANTS.JML_BULAN_PRORATA,
        TGL_TRANSAKSI: formatTanggalJr(new Date()),
        MASA_LAKU_LALU: masaLakuLalu,
        MASA_LAKU_LALU_TB: masaLakuLalu,
        MASA_LAKU_LALU_TB_NBD: masaLakuLalu,
        MASA_LAKU_YAD: masaLakuYad,
        KEND_LISTRIK: kodeMerek.startsWith('5') ? 'Y' : 'N',
      },
    ],
  };
}

function buildTarifPerTahun(jrData: JrApiResponse): TarifJr[] {
  const kartu = [jrData.NILAI_KD_0, jrData.NILAI_KD_1, jrData.NILAI_KD_2, jrData.NILAI_KD_3, jrData.NILAI_KD_4];
  const pokok = [jrData.NILAI_SW_0, jrData.NILAI_SW_1, jrData.NILAI_SW_2, jrData.NILAI_SW_3, jrData.NILAI_SW_4];
  const denda = [jrData.NILAI_DD_0, jrData.NILAI_DD_1, jrData.NILAI_DD_2, jrData.NILAI_DD_3, jrData.NILAI_DD_4];

  return TARIF_LABELS.map((keterangan, index) => ({
    keterangan,
    kartu_jr: kartu[index],
    pokok_jr: pokok[index],
    denda_jr: denda[index],
    subtotal: kartu[index] + pokok[index] + denda[index],
  }));
}

export function mapJrResponse(jrData: JrApiResponse): JrResponse {
  const tarifPerTahun = buildTarifPerTahun(jrData);

  const totalTarif = tarifPerTahun.reduce(
    (total, item) => ({
      kartu_jr: total.kartu_jr + item.kartu_jr,
      pokok_jr: total.pokok_jr + item.pokok_jr,
      denda_jr: total.denda_jr + item.denda_jr,
      total: total.total + item.subtotal,
    }),
    {
      kartu_jr: 0,
      pokok_jr: 0,
      denda_jr: 0,
      total: 0,
    }
  );

  return {
    ref_id: jrData.JR_REF_ID,
    nopol: jrData.NOPOL,
    golongan: jrData.KODE_GOLONGAN,
    jenis: jrData.KODE_JENIS,
    tarif_per_tahun: tarifPerTahun,
    total_tarif: totalTarif,
    nilai_prorata: jrData.NILAI_PRORATA,
  };
}
