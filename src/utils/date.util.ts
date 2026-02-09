/**
 * Date Utility Functions
 * Helper untuk manipulasi tanggal
 * Pure functions - tidak mengubah input
 */

/**
 * Format tanggal ke string YYYY-MM-DD
 * Return null jika date tidak valid
 */
export function formatDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  
  // Validasi apakah date adalah Date object yang valid
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Hitung selisih hari antara 2 tanggal
 * @returns jumlah hari (positif jika date2 > date1)
 */
export function daysDifference(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = date2.getTime() - date1.getTime();
  return Math.floor(diff / msPerDay);
}

/**
 * Cek apakah tanggal sudah lewat dari hari ini
 */
export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Tambah hari ke tanggal
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Parse string tanggal ke Date object
 * Format yang diterima: YYYY-MM-DD, DD/MM/YYYY
 */
export function parseDate(dateString: string): Date | null {
  // Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString);
  }
  
  // Format DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}-${month}-${day}`);
  }
  
  return null;
}

/**
 * Hitung selisih waktu dalam hari, bulan, dan tahun
 * @param startDate - Tanggal mulai
 * @param endDate - Tanggal akhir
 * @returns Object berisi hari, bulan, dan tahun
 */
export function getDateDifference(startDate: Date, endDate: Date): {
  hari: number;
  bulan: number;
  tahun: number;
} {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Hitung total hari
  const msPerDay = 24 * 60 * 60 * 1000;
  const totalHari = Math.floor((end.getTime() - start.getTime()) / msPerDay);
  
  // Hitung tahun
  let tahun = end.getFullYear() - start.getFullYear();
  
  // Hitung bulan
  let bulan = end.getMonth() - start.getMonth();
  
  // Adjust jika bulan negatif
  if (bulan < 0) {
    tahun--;
    bulan += 12;
  }
  
  // Adjust jika hari end lebih kecil dari hari start
  if (end.getDate() < start.getDate()) {
    bulan--;
    if (bulan < 0) {
      tahun--;
      bulan += 12;
    }
  }
  
  return {
    hari: totalHari,
    bulan: tahun * 12 + bulan,
    tahun
  };
}
