/**
 * Utility untuk menghitung bulan telat (penalty months) 
 * mengikuti logika PHP DateTime::diff() dengan grace period 15 hari
 * 
 * Logika ini sama dengan yang digunakan di infopkb.php:
 * - Menghitung tahun, bulan, dan hari secara terpisah
 * - Jika hari > 15, baru tambah 1 bulan (grace period)
 * - Total bulan = bulan + (tahun * 12)
 */

interface DateDifference {
  years: number;
  months: number;
  days: number;
  totalMonths: number;
}

/**
 * Hitung selisih tanggal dengan cara yang sama seperti PHP DateTime::diff()
 * 
 * @param dateFrom - Tanggal awal (jatuh tempo)
 * @param dateTo - Tanggal akhir (sekarang)
 * @returns Object berisi tahun, bulan, hari, dan total bulan
 */
export function calculateDateDifference(dateFrom: Date, dateTo: Date): DateDifference {
  // Clone untuk menghindari mutasi
  const d1 = new Date(dateFrom);
  const d2 = new Date(dateTo);
  
  let years = d2.getFullYear() - d1.getFullYear();
  let months = d2.getMonth() - d1.getMonth();
  let days = d2.getDate() - d1.getDate();
  
  // Adjust jika days negatif
  if (days < 0) {
    months--;
    // Ambil jumlah hari di bulan sebelumnya
    const prevMonth = new Date(d2.getFullYear(), d2.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  // Adjust jika months negatif
  if (months < 0) {
    years--;
    months += 12;
  }
  
  // Hitung total months
  const totalMonths = months + (years * 12);
  
  return {
    years,
    months,
    days,
    totalMonths
  };
}

/**
 * Hitung bulan telat untuk denda pajak
 * Mengikuti logika PHP: if($sel_tgl['d'] > 15) $m++;
 * 
 * @param jatuhTempo - Tanggal jatuh tempo pembayaran
 * @param sekarang - Tanggal sekarang (atau tanggal pengecekan)
 * @param maxMonths - Maksimal bulan telat (default 24 bulan / 2 tahun)
 * @returns Jumlah bulan telat untuk perhitungan denda
 * 
 * @example
 * // Telat 3 bulan 10 hari -> return 3 (karena 10 <= 15)
 * // Telat 3 bulan 20 hari -> return 4 (karena 20 > 15)
 * // Telat 1 hari -> return 0 (karena 1 <= 15)
 */
export function calculatePenaltyMonths(
  jatuhTempo: Date,
  sekarang: Date,
  maxMonths: number = 24
): number {
  // Jika belum lewat jatuh tempo, tidak ada denda
  if (sekarang <= jatuhTempo) {
    return 0;
  }
  
  // Hitung selisih tanggal
  const diff = calculateDateDifference(jatuhTempo, sekarang);
  
  // Mulai dari total bulan
  let penaltyMonths = diff.totalMonths;
  
  // Grace period: jika hari > 15, tambah 1 bulan
  // Ini sesuai dengan logika PHP: if($sel_tgl['d'] > 15) $m++;
  if (diff.days > 15) {
    penaltyMonths++;
  }
  
  // Batasi maksimal
  return Math.min(penaltyMonths, maxMonths);
}

/**
 * Versi dengan detail untuk debugging
 * Mengembalikan detail perhitungan untuk keperluan logging/debugging
 */
export function calculatePenaltyMonthsWithDetail(
  jatuhTempo: Date,
  sekarang: Date,
  maxMonths: number = 24
) {
  if (sekarang <= jatuhTempo) {
    return {
      penaltyMonths: 0,
      detail: {
        years: 0,
        months: 0,
        days: 0,
        totalMonths: 0,
        gracePeriodApplied: false,
        cappedAtMax: false
      }
    };
  }
  
  const diff = calculateDateDifference(jatuhTempo, sekarang);
  let penaltyMonths = diff.totalMonths;
  const gracePeriodApplied = diff.days > 15;
  
  if (gracePeriodApplied) {
    penaltyMonths++;
  }
  
  const cappedAtMax = penaltyMonths > maxMonths;
  if (cappedAtMax) {
    penaltyMonths = maxMonths;
  }
  
  return {
    penaltyMonths,
    detail: {
      years: diff.years,
      months: diff.months,
      days: diff.days,
      totalMonths: diff.totalMonths,
      gracePeriodApplied,
      cappedAtMax,
      calculation: `${diff.years}y ${diff.months}m ${diff.days}d → ${diff.totalMonths} bulan${gracePeriodApplied ? ' + 1 (hari > 15)' : ''} = ${Math.min(penaltyMonths, maxMonths)} bulan`
    }
  };
}
