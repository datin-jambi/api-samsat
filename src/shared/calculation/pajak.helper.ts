
const startOpsen = '2025-01-06';

export function validateIsOpsen(periode: string): boolean {
    return new Date(periode) >= new Date(startOpsen);
}


// ========================================
// Helper Functions - Konstanta
// ========================================

/**
 * Mendapatkan tarif berdasarkan status opsen
 * @param isOpsen - Status opsen
 * @returns Tarif (1% jika opsen true, 1.5% jika false)
 */
function getTarif(isOpsen: boolean): number {
    return isOpsen ? 0.01 : 0.015; // 1% atau 1.5%
}

/**
 * Mendapatkan pengenaan berdasarkan status opsen
 * @param isOpsen - Status opsen
 * @returns Pengenaan (90.4% jika opsen true, 100% jika false)
 */
function getPengenaan(isOpsen: boolean): number {
    return isOpsen ? 0.904 : 1.0; // 90.4% atau 100%
}

// ========================================
// Fungsi Perhitungan PKB & Opsen
// ========================================

/**
 * Menghitung PKB (Pajak Kendaraan Bermotor)
 * Rumus: PKB = tarif × nilai_jual × bobot × pengenaan
 * @param nilaiJual - Nilai jual kendaraan
 * @param bobot - Bobot kendaraan
 * @param isOpsen - Status opsen
 * @returns Nilai PKB
 */
export function calculatePKB(
    nilaiJual: number,
    bobot: number | string,
    isOpsen: boolean
): number {
    const bobotNumber = typeof bobot === 'string' ? parseFloat(bobot) : bobot;
    const tarif = getTarif(isOpsen);
    const pengenaan = getPengenaan(isOpsen);
    
    return tarif * nilaiJual * bobotNumber * pengenaan;
}

/**
 * Menghitung Opsen
 * @param pkb - Nilai PKB
 * @param isOpsen - Status opsen
 * @returns Nilai Opsen (66% dari PKB jika opsen true, 0 jika false)
 */
export function calculateOpsen(pkb: number, isOpsen: boolean): number {
    return isOpsen ? pkb * 0.66 : 0;
}

/**
 * Menghitung PKB dan Opsen sekaligus
 * @param nilaiJual - Nilai jual kendaraan
 * @param bobot - Bobot kendaraan
 * @param isOpsen - Status opsen
 * @returns Object berisi pokok (PKB) dan opsen
 */
export function calculatePajak(
    nilaiJual: number,
    bobot: number | string,
    isOpsen: boolean
) {
    const pkb = calculatePKB(nilaiJual, bobot, isOpsen);
    const opsen = calculateOpsen(pkb, isOpsen);
    
    return {
        pokok: pkb,
        opsen,
    };
}

// ========================================
// Fungsi Perhitungan Denda
// ========================================

/**
 * Menghitung denda PKB
 * Rumus opsen false: (2% + (Bulan Telat × 2%)) × PKB
 * Rumus opsen true: (1% + (Bulan Telat × 2%)) × PKB
 * @param pkb - Nilai PKB
 * @param bulanTelat - Jumlah bulan keterlambatan
 * @param isOpsen - Status opsen
 * @returns Nilai denda PKB
 */
export function calculateDendaPKB(
    pkb: number,
    bulanTelat: number,
    isOpsen: boolean
): number {
    const baseRate = isOpsen ? 0.01 : 0.02; // 1% atau 2%
    const dendaRate = baseRate + (bulanTelat * 0.02);
    return dendaRate * pkb;
}

/**
 * Menghitung denda Opsen
 * Rumus: (1% + (Bulan Telat × 2%)) × Opsen
 * @param opsen - Nilai Opsen
 * @param bulanTelat - Jumlah bulan keterlambatan
 * @param isOpsen - Status opsen
 * @returns Nilai denda Opsen (0 jika opsen false)
 */
export function calculateDendaOpsen(
    opsen: number,
    bulanTelat: number,
    isOpsen: boolean
): number {
    if (!isOpsen) return 0;

    const dendaRate = 0.01 + (bulanTelat * 0.01);
    return dendaRate * opsen;
}

/**
 * Menghitung semua denda (PKB dan Opsen)
 * @param pkb - Nilai PKB
 * @param opsen - Nilai Opsen
 * @param bulanTelat - Jumlah bulan keterlambatan
 * @param isOpsen - Status opsen
 * @returns Object berisi dendaPKB dan dendaOpsen
 */
export function calculateDenda(
    pkb: number,
    opsen: number,
    bulanTelat: number,
    isOpsen: boolean
) {
    return {
        dendaPKB: calculateDendaPKB(pkb, bulanTelat, isOpsen),
        dendaOpsen: calculateDendaOpsen(opsen, bulanTelat, isOpsen),
    };
}