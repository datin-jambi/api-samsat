/**
 * Normalisasi tanggal akhir STNK agar sesuai dengan urutan tahun.
 * 
 * Referensi PHP (line 299-314 & hitstnk line 1471-1478):
 * 1. Jika tahun STNK > tahun PKB: kurangi 5 tahun sampai < PKB atau < today
 * 2. Jika STNK sudah mati (< today): tambah 5 tahun sampai STNK+5 > today
 * 
 * @param tg_akhir_stnk - Tanggal akhir STNK (format: string atau Date)
 * @param tg_akhir_pkb - Tanggal akhir PKB (format: string atau Date)
 * @returns Date yang sudah di-normalize
 */
export function tgAkhirStnk(
  tg_akhir_stnk: string | Date,
  tg_akhir_pkb: string | Date
): Date {
  let stnkDate = new Date(tg_akhir_stnk);
  const pkbDate = new Date(tg_akhir_pkb);

  // Validasi
  if (isNaN(stnkDate.getTime()) || isNaN(pkbDate.getTime())) {
    return stnkDate;
  }

  const today = new Date();
  const y1 = today.getFullYear();
  const y2 = pkbDate.getFullYear();

  // Step 1: Jika tahun STNK > tahun PKB, kurangi 5 tahun
  if (stnkDate.getFullYear() > y2) {
    const stnkAkhir = new Date(stnkDate);

    while (true) {
      stnkAkhir.setFullYear(stnkAkhir.getFullYear() - 5);
      const y = stnkAkhir.getFullYear();

      if (y < y2) break;
      else if (y < y1) break;
    }

    stnkDate = stnkAkhir;
  }

  // Step 2: Jika STNK sudah mati (< today), tambah 5 tahun sampai valid
  // Referensi PHP hitstnk() Case 2 (line 1473-1478)
  if (stnkDate < today) {
    while (true) {
      const stnkYad = new Date(stnkDate);
      stnkYad.setFullYear(stnkYad.getFullYear() + 5);
      
      if (stnkYad > today) break;
      
      stnkDate = stnkYad;
    }
  }

  return stnkDate;
}