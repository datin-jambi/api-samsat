/**
 * Number Utility Functions
 * Helper untuk manipulasi angka dan formatting
 * Pure functions - tidak mengubah input
 */

/**
 * Format angka ke format Rupiah
 * @example formatRupiah(1500000) => "Rp 1.500.000"
 */
export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

/**
 * Format angka dengan pemisah ribuan
 * @example formatNumber(1500000) => "1.500.000"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('id-ID');
}

/**
 * Bulatkan ke atas dengan kelipatan tertentu
 * @example roundUp(1234, 100) => 1300
 * @example roundUp(1234, 1000) => 2000
 */
export function roundUp(num: number, multiple: number): number {
  return Math.ceil(num / multiple) * multiple;
}

/**
 * Bulatkan ke bawah dengan kelipatan tertentu
 * @example roundDown(1234, 100) => 1200
 */
export function roundDown(num: number, multiple: number): number {
  return Math.floor(num / multiple) * multiple;
}

/**
 * Hitung persentase
 * @example calculatePercentage(25, 100) => 25
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Hitung nilai dari persentase
 * @example getPercentageValue(100000, 10) => 10000
 */
export function getPercentageValue(amount: number, percentage: number): number {
  return (amount * percentage) / 100;
}

/**
 * Pastikan angka dalam range tertentu
 * @example clamp(150, 0, 100) => 100
 * @example clamp(-10, 0, 100) => 0
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
