/**
 * Normalisasi tanggal akhir STNK agar tidak melewati tanggal akhir PKB.
 * Jika STNK lebih besar dari PKB, kurangi 5 tahun berulang sampai <= PKB.
 */
export function tgAkhirStnk(tg_akhir_stnk: string, tg_akhir_pkb: string): Date {
    const stnkDate = new Date(tg_akhir_stnk);
    const pkbDate = new Date(tg_akhir_pkb);

    if (isNaN(stnkDate.getTime()) || isNaN(pkbDate.getTime())) {
        return stnkDate;
    }

    const stnkAkhir = new Date(stnkDate);

    while (stnkAkhir > pkbDate) {
        stnkAkhir.setFullYear(stnkAkhir.getFullYear() - 5);
    }

    return stnkAkhir;
}