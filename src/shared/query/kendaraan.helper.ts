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
  const findByTable = async (tableName: 't_trnkb' | 't_mstkb' | 'tt_trnkb'): Promise<DetailKendaraan | null> => {
    try {
      return await getDetailKendaraan(
        normalizedNopol,
        '',
        tableName,
        ''
      );
    } catch (error: unknown) {
      // Beberapa tabel legacy bisa memiliki schema berbeda.
      // Jika ada kolom yang tidak tersedia, skip ke tabel berikutnya.
      if (
        error instanceof Error
        && typeof error.message === 'string'
        && error.message.includes('Kolom tidak ditemukan')
      ) {
        return null;
      }

      throw error;
    }
  };

  let kendaraan = await findByTable('t_trnkb');

  if (!kendaraan) {
    kendaraan = await findByTable('t_mstkb');
  }

  if (!kendaraan) {
    kendaraan = await findByTable('tt_trnkb');
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