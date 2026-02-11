/**
 * String Utilities
 * 
 * Helper functions untuk manipulasi string
 */

/**
 * Normalize nomor polisi kendaraan
 * 
 * Format nopol bisa bervariasi:
 * - "BH 6869 IK" (dengan spasi)
 * - "BH6869IK" (tanpa spasi)
 * - "bh 6869 ik" (lowercase)
 * 
 * Function ini akan:
 * 1. Trim whitespace di awal/akhir
 * 2. Convert ke uppercase
 * 3. Hapus semua spasi internal
 * 4. Validasi format basic (hanya alphanumeric)
 * 
 * @param nopol - Nomor polisi input
 * @returns Nomor polisi yang sudah dinormalisasi (tanpa spasi, uppercase)
 * 
 * @example
 * normalizeNopol("BH 6869 IK") // "BH6869IK"
 * normalizeNopol("bh 6869 ik") // "BH6869IK"
 * normalizeNopol("  BH6869IK  ") // "BH6869IK"
 */
export function normalizeNopol(nopol: string): string {
  if (!nopol) {
    return '';
  }

  return nopol
    .trim()                    // Hapus whitespace di awal/akhir
    .toUpperCase()             // Convert ke uppercase
    .replace(/\s+/g, '');      // Hapus semua spasi (1 atau lebih)
}

/**
 * Format nomor polisi ke format readable (dengan spasi)
 * 
 * Contoh: "BH6869IK" -> "BH 6869 IK"
 * 
 * Pattern umum: 
 * - 1-2 huruf (kode wilayah)
 * - 1-4 angka
 * - 1-3 huruf (kode seri)
 * 
 * @param nopol - Nomor polisi tanpa spasi
 * @returns Nomor polisi dengan format spasi
 * 
 * @example
 * formatNopol("BH6869IK") // "BH 6869 IK"
 * formatNopol("B1234ABC") // "B 1234 ABC"
 */
export function formatNopol(nopol: string): string {
  if (!nopol) {
    return '';
  }

  // Normalize dulu
  const normalized = normalizeNopol(nopol);

  // Pattern: huruf - angka - huruf
  // Contoh: BH6869IK -> BH 6869 IK
  const match = normalized.match(/^([A-Z]{1,2})(\d{1,4})([A-Z]{1,3})$/);

  if (match) {
    const [_, kodeWilayah, nomor, kodeSeri] = match;
    return `${kodeWilayah} ${nomor} ${kodeSeri}`;
  }

  // Kalau tidak match pattern, return as-is
  return normalized;
}

/**
 * Validasi format nomor polisi
 * 
 * @param nopol - Nomor polisi
 * @returns true jika valid
 */
export function isValidNopol(nopol: string): boolean {
  if (!nopol) {
    return false;
  }

  const normalized = normalizeNopol(nopol);

  // Pattern: 1-2 huruf, 1-4 angka, 1-3 huruf
  // Contoh: BH6869IK, B1234ABC
  const pattern = /^[A-Z]{1,2}\d{1,4}[A-Z]{1,3}$/;

  return pattern.test(normalized);
}
