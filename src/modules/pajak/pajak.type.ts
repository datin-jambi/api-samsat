/**
 * Pajak Types
 * 
 * Interface untuk typing data pajak
 */

export interface DetailPajakResponse {
    nopol: string;
    tahun_rakitan: number;
    terakhir_bayar: string;
    jarak: {
        hari: number,
        tahun: number,
        bulan: number,
    },
    njkb: {
        nilai_jual: string,
        bobot: number,
    },

    tagihan: {
        total: {
            pkb: {
                pokok: string,
                denda: string,
            },
            opsen: {
                pokok: string,
                denda: string,
            },
            grand_total: string,
        },
        rincian: TagihanPajak[],
    };
}

interface TagihanPajak {
    is_opsen: boolean;
    periode: {
        periode: string;
        total_bulan_telat: number;
    };
    pkb: {
        pokok: string;
        denda: string;
    };
    opsen: {
        opsen: string;
        denda_opsen: string;
    };
    total: string;
}