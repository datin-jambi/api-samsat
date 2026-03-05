import {
    getDetailKendaraan,
} from '../../modules/kendaraan/kendaraan.query';
import { DetailKendaraan } from '../../modules/kendaraan/kendaraan.type';

/**
 * Get kendaraan data dari berbagai tabel secara berurutan
 * Coba dari t_trnkb dulu, kalau tidak ada coba t_mstkb, kalau tidak ada juga coba tt_trnkb
 * 
 * @param normalizedNopol - Nomor polisi yang sudah dinormalisasi (tanpa spasi, uppercase)
 * @returns Data kendaraan atau null jika tidak ditemukan
 */
export async function getKendaraanData(normalizedNopol: string): Promise<DetailKendaraan | null> {
  let kendaraan = await getDetailKendaraan(
    normalizedNopol,
    '',
    't_trnkb',
    ''
  );
  
  // Kalau tidak ada, coba dari t_mstkb
  if (!kendaraan) {
    kendaraan = await getDetailKendaraan(
      normalizedNopol,
      '',
      't_mstkb',
      ''
    );
  }

  // Kalau masih tidak ada, coba dari tt_trnkb
  if (!kendaraan) {
    kendaraan = await getDetailKendaraan(
      normalizedNopol,
      '',
      'tt_trnkb',
      ''
    );
  }

  return kendaraan;
}

export function updateKdKelKbByPlat(kd_plat: number): string {
  switch (kd_plat) {
    case 2:
      return 'U';
    case 3:
      return 'D';
    default:
      return 'P';
  }
}