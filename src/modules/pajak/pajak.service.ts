import { 
  DetailPajakResponse
} from './pajak.type';
import { getKendaraanByNopol } from '../kendaraan/kendaraan.service';
import { 
  validateIsOpsen,
  calculatePajak,
  calculateDenda
} from '../../shared/calculation/pajak.helper';
import { getDateDifference } from '../../utils/date.util';
import { formatRupiah } from '../../utils/number.util';

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

  // 2. Hitung periode pajak yang harus dibayar
  const terakhirBayar = new Date(kendaraan.tg_akhir_pkb);
  const sekarang = new Date();
  
  // Hitung jarak waktu dari terakhir bayar
  const jarak = getDateDifference(terakhirBayar, sekarang);
  
  // 3. Hitung tagihan per periode (per tahun)
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
    
    // Tanggal jatuh tempo periode (1 Januari tahun sampai)
    const jatuhTempo = new Date(tahunSampai, 0, 1);
    
    // Tagihan mulai muncul 3 bulan sebelum jatuh tempo
    const mulaiTagihan = new Date(jatuhTempo);
    mulaiTagihan.setMonth(mulaiTagihan.getMonth() - 3);
    
    // Skip periode jika belum waktunya muncul tagihan
    if (sekarang < mulaiTagihan) {
      continue;
    }
    
    // Tentukan periode untuk cek opsen (gunakan jatuh tempo periode)
    // Karena opsen berlaku untuk pembayaran yang jatuh tempo setelah 2025-01-06
    const periodeStr = `${tahunSampai}-01-01`;
    const isOpsen = validateIsOpsen(periodeStr);
    
    // Hitung pajak pokok dan opsen
    const { pokok, opsen } = calculatePajak(
      kendaraan.njkb.nilai_jual,
      kendaraan.njkb.bobot,
      isOpsen
    );
    
    // Hitung bulan telat
    let bulanTelat = 0;
    
    // Jika sudah lewat jatuh tempo, hitung bulan telat
    if (sekarang > jatuhTempo) {
      // Hitung selisih waktu dalam hari
      const selisihMs = sekarang.getTime() - jatuhTempo.getTime();
      const selisihHari = selisihMs / (1000 * 60 * 60 * 24);
      
      // Bulatkan ke atas (ceiling) walaupun lewat 1 hari
      const selisihBulan = Math.ceil(selisihHari / 30);
      
      // Maksimal pengenaan bulan telat adalah 24 bulan (2 tahun)
      bulanTelat = Math.min(selisihBulan, 24);
    }
    
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
  
  const grandTotal = totalPokok + totalDenda + totalOpsen + totalDendaOpsen;
  
  // 4. Susun response
  const data: DetailPajakResponse = {
    nopol: kendaraan.no_polisi,
    tahun_rakitan: kendaraan.th_rakitan,
    terakhir_bayar: kendaraan.tg_akhir_pkb,
    jarak,
    njkb: {
      nilai_jual: formatRupiah(Math.round(kendaraan.njkb.nilai_jual)),
      bobot: Number(kendaraan.njkb.bobot),
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

