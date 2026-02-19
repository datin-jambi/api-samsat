/**
 * Normalisasi tanggal akhir STNK agar sesuai dengan urutan tahun.
 * Jika tahun STNK > tahun PKB, kurangi 5 tahun sampai:
 * - Tahun STNK < tahun PKB, ATAU
 * - Tahun STNK < tahun (hari ini)
 * 
 * @param tg_akhir_stnk - Tanggal akhir STNK (format: string atau Date)
 * @param tg_akhir_pkb - Tanggal akhir PKB (format: string atau Date)
 * @returns Date yang sudah di-normalize
 */
export function tgAkhirStnk(
  tg_akhir_stnk: string | Date,
  tg_akhir_pkb: string | Date
): Date {
  const stnkDate = new Date(tg_akhir_stnk);
  const pkbDate = new Date(tg_akhir_pkb);

  // Validasi
  if (isNaN(stnkDate.getTime()) || isNaN(pkbDate.getTime())) {
    return stnkDate;
  }

  // y1 = Tahun hari ini (diambil dari date('d/m/Y') di PHP)
  const today = new Date();
  const y1 = today.getFullYear();
  
  // y2 = Tahun akhir PKB
  const y2 = pkbDate.getFullYear();

  // ✅ Hanya proses jika tahun STNK > tahun PKB
  if (stnkDate.getFullYear() > y2) {
    const stnkAkhir = new Date(stnkDate);

    // Loop: kurangi 5 tahun sampai kondisi terpenuhi
    while (true) {
      stnkAkhir.setFullYear(stnkAkhir.getFullYear() - 5);
      const y = stnkAkhir.getFullYear();

      // ✅ Break jika tahun < PKB atau tahun < tahun hari ini (like y1)
      if (y < y2) break;
      else if (y < y1) break;
    }

    return stnkAkhir;
  }

  return stnkDate;
}