import { 
  DetailPajakResponse
} from './pajak.type';
import { getKendaraanByNopol } from '../kendaraan/kendaraan.service';
import { getNjkbKendaraanQuery } from '../kendaraan/kendaraan.query';
import { 
  validateIsOpsen,
  calculatePajak,
  calculateDenda
} from '../../shared/calculation/pajak.helper';
import { getDateDifference } from '../../utils/date.util';
import { formatRupiah } from '../../utils/number.util';
import { calculatePenaltyMonths } from '../../utils/penalty-month.util';

/**
 * Get pajak by nopol
 * Mengambil data kendaraan dan menghitung tagihan pajak
 */
export async function getPajakByNopol(
  nopol: string
): Promise<DetailPajakResponse | null> {
  // 1. Ambil data kendaraan dari service kendaraan
  const kendaraan = await getKendaraanByNopol(nopol);
  
  if (!kendaraan) {
    return null;
  }

  // 2. Ambil NJKB dalam bentuk numerik untuk perhitungan
  const njkbData = await getNjkbKendaraanQuery(kendaraan.kd_merek_kb, kendaraan.th_rakitan);
  const nilaiJual = Math.round(njkbData?.nilai_jual || 0);
  const bobot = Number(njkbData?.bobot || 0);

  // 3. Validasi tanggal terakhir bayar
  if (!kendaraan.tg_akhir_pkb) {
    throw new Error('Data tanggal terakhir bayar (tg_akhir_pkb) tidak ditemukan');
  }

  // Parse tanggal - kendaraan.tg_akhir_pkb adalah string dari service
  const terakhirBayar = new Date(kendaraan.tg_akhir_pkb);
  
  // Validasi apakah date valid
  if (isNaN(terakhirBayar.getTime())) {
    throw new Error(`Format tanggal terakhir bayar tidak valid: ${kendaraan.tg_akhir_pkb}`);
  }
  
  const sekarang = new Date();
  
  // Hitung jarak waktu dari terakhir bayar
  const jarak = getDateDifference(terakhirBayar, sekarang);
  
  // 4. Hitung tagihan per periode (per tahun)
  const rincian = [];
  let totalPokok = 0;
  let totalDenda = 0;
  let totalOpsen = 0;
  let totalDendaOpsen = 0;
  
  // Mulai dari tahun terakhir bayar (bukan tahun setelahnya)
  // const tahunMulai = terakhirBayar.getFullYear();
  const tahunMulai = terakhirBayar.getFullYear() + 1;
  const tahunSekarang = sekarang.getFullYear();
  
  for (let tahun = tahunMulai; tahun <= tahunSekarang; tahun++) {
    const tahunDari = tahun;
    const tahunSampai = tahun + 1;
    
    // Tanggal jatuh tempo periode mengikuti tanggal terakhir bayar, tapi tahunnya sesuai periode
    // Misal: terakhir bayar 3 Nov 2017, maka periode 2025/2026 jatuh tempo 3 Nov 2025
    const bulanTerakhirBayar = terakhirBayar.getMonth();
    const hariTerakhirBayar = terakhirBayar.getDate();
    
    // Jatuh tempo di tahun "dari" (bukan tahun "sampai")
    // Karena periode 2025/2026 berarti bayar di 2025, berlaku sampai 2026
    let jatuhTempo = new Date(tahunDari, bulanTerakhirBayar, hariTerakhirBayar);
    
    // Handle edge case: jika tanggal tidak valid (misal 31 Feb), gunakan hari terakhir bulan tersebut
    if (jatuhTempo.getMonth() !== bulanTerakhirBayar) {
      jatuhTempo = new Date(tahunDari, bulanTerakhirBayar + 1, 0);
    }
    
    // Tagihan mulai muncul 3 bulan sebelum jatuh tempo
    const mulaiTagihan = new Date(jatuhTempo);
    mulaiTagihan.setMonth(mulaiTagihan.getMonth() - 3);
    
    // Skip periode jika belum waktunya muncul tagihan
    if (sekarang < mulaiTagihan) {
      continue;
    }
    
    // Tentukan periode untuk cek opsen (gunakan jatuh tempo periode)
    // Karena opsen berlaku untuk pembayaran yang jatuh tempo setelah 2025-01-06
    const periodeStr = jatuhTempo.toISOString().split('T')[0];
    const isOpsen = validateIsOpsen(periodeStr);
    
    // Hitung pajak pokok dan opsen
    const { pokok, opsen } = calculatePajak(
      nilaiJual,
      bobot,
      isOpsen
    );
    
    // Hitung bulan telat menggunakan metode PHP-style dengan grace period 15 hari
    // Logika: jika hari > 15, baru tambah 1 bulan
    // Sama dengan logika di infopkb.php: if($sel_tgl['d'] > 15) $m++;
    const bulanTelat = calculatePenaltyMonths(jatuhTempo, sekarang, 24);
    
    // Hitung denda
    const { dendaPKB, dendaOpsen } = calculateDenda(
      pokok,
      opsen,
      bulanTelat,
      isOpsen
    );
    
    // Tambahkan ke rincian
    const totalPeriode = pokok + opsen + dendaPKB + dendaOpsen;
    
    rincian.push({
      is_opsen: isOpsen,
      periode: {
        periode: `${tahunDari}/${tahunSampai}`,
        total_bulan_telat: bulanTelat
      },
      pkb: {
        pokok: formatRupiah(pokok),
        denda: formatRupiah(dendaPKB)
      },
      opsen: {
        opsen: formatRupiah(opsen),
        denda_opsen: formatRupiah(dendaOpsen)
      },
      total: formatRupiah(totalPeriode)
    });
    
    // Akumulasi total
    totalPokok += pokok;
    totalDenda += dendaPKB;
    totalOpsen += opsen;
    totalDendaOpsen += dendaOpsen;
  }
  
  // Batasi maksimal 6 periode terakhir
  const MAX_PERIODE = 6;
  if (rincian.length > MAX_PERIODE) {
    // Ambil 6 periode terakhir
    rincian.splice(0, rincian.length - MAX_PERIODE);
    
    // Hitung ulang total dari 6 periode terakhir
    totalPokok = 0;
    totalDenda = 0;
    totalOpsen = 0;
    totalDendaOpsen = 0;
    
    rincian.forEach(item => {
      // Parse kembali dari format rupiah ke number
      const parseRupiah = (str: string): number => {
        return Number(str.replace(/Rp\s?/g, '').replace(/\./g, '').replace(/,/g, '.'));
      };
      
      totalPokok += parseRupiah(item.pkb.pokok);
      totalDenda += parseRupiah(item.pkb.denda);
      totalOpsen += parseRupiah(item.opsen.opsen);
      totalDendaOpsen += parseRupiah(item.opsen.denda_opsen);
    });
  }
  
  const grandTotal = totalPokok + totalDenda + totalOpsen + totalDendaOpsen;
  
  // 5. Susun response
  const data: DetailPajakResponse = {
    nopol: kendaraan.no_polisi,
    tahun_rakitan: kendaraan.th_rakitan,
    terakhir_bayar: kendaraan.tg_akhir_pkb,
    jarak,
    njkb: {
      nilai_jual: kendaraan.njkb.nilai_jual,
      bobot: kendaraan.njkb.bobot,
    },
    tagihan: {
      total: {
        pkb: {
          pokok: formatRupiah(totalPokok),
          denda: formatRupiah(totalDenda)
        },
        opsen: {
          pokok: formatRupiah(totalOpsen),
          denda: formatRupiah(totalDendaOpsen)
        },
        grand_total: formatRupiah(grandTotal)
      },
      rincian,
    }
  };

  return data;
}

