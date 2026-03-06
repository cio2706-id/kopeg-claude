"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  FileText,
  Send,
  CheckCircle,
  CreditCard,
  ArrowRight,
  Sparkles,
  Info,
  Package,
  Star,
  Upload,
  Phone,
  ArrowLeft,
  Landmark,
  Plane,
  Car,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency, calculateMonthlyInstallment } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type LoanType = "reguler" | "khusus" | "barang" | "travel" | "kepemilikan_kendaraan" | "channeling";

interface LoanTypeConfig {
  label: string;
  description: string;
  coa: string;
  rate: number;
  maxAmount?: number;
  maxTenor?: number;
  icon: React.ReactNode;
  colors: { bg: string; border: string; text: string; icon: string };
}

const LOAN_TYPES: Record<LoanType, LoanTypeConfig> = {
  reguler: {
    label: "Pinjaman Reguler",
    description: "Maks Rp 25 juta, tenor 10 bulan",
    coa: "110304",
    rate: 12,
    maxAmount: 25000000,
    maxTenor: 10,
    icon: <CreditCard className="w-6 h-6" />,
    colors: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", icon: "text-teal-600" },
  },
  khusus: {
    label: "Pinjaman Khusus",
    description: "Maks Rp 100 juta, tenor 60 bulan",
    coa: "110305",
    rate: 7.5,
    maxAmount: 100000000,
    maxTenor: 60,
    icon: <Star className="w-6 h-6" />,
    colors: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-600" },
  },
  barang: {
    label: "Pinjaman Barang",
    description: "Pinjaman untuk pembelian barang",
    coa: "110306",
    rate: 8,
    icon: <Package className="w-6 h-6" />,
    colors: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", icon: "text-purple-600" },
  },
  travel: {
    label: "Pinjaman Travel",
    description: "Pinjaman untuk keperluan perjalanan",
    coa: "110307",
    rate: 10,
    icon: <Plane className="w-6 h-6" />,
    colors: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-600" },
  },
  kepemilikan_kendaraan: {
    label: "Pinjaman Kepemilikan Kendaraan",
    description: "Pinjaman untuk pembelian kendaraan",
    coa: "110308",
    rate: 8,
    icon: <Car className="w-6 h-6" />,
    colors: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", icon: "text-sky-600" },
  },
  channeling: {
    label: "Pinjaman Channeling",
    description: "Melalui Bank Mandiri & BSI",
    coa: "",
    rate: 0,
    icon: <Landmark className="w-6 h-6" />,
    colors: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", icon: "text-sky-600" },
  },
};

// ─── Reguler Criteria ────────────────────────────────────────────────────────

const LOAN_CRITERIA = [
  { value: "pendidikan", label: "Pendidikan" },
  { value: "perumahan", label: "Perumahan" },
  { value: "musibah", label: "Musibah" },
];

const MUSIBAH_TYPES = [
  { value: "kecelakaan", label: "Kecelakaan" },
  { value: "kematian", label: "Kematian" },
  { value: "kebanjiran", label: "Kebanjiran" },
  { value: "kebakaran", label: "Kebakaran" },
];

// ─── Tenor options by type ───────────────────────────────────────────────────

function getTenorOptions(type: LoanType): number[] {
  const config = LOAN_TYPES[type];
  const max = config.maxTenor || 60;
  const options = [3, 6, 10, 12, 18, 24, 36, 48, 60];
  return options.filter((t) => t <= max);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LoanApplicationPage() {
  const [step, setStep] = useState<"select" | "terms" | "form" | "success" | "channeling">("select");
  const [loanType, setLoanType] = useState<LoanType | "">("");

  // Common fields
  const [amount, setAmount] = useState("");
  const [tenor, setTenor] = useState("");
  const [purpose, setPurpose] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // Reguler-specific
  const [loanCriteria, setLoanCriteria] = useState("");
  const [musibahType, setMusibahType] = useState("");
  const [requestMonth, setRequestMonth] = useState("");
  const [previousBalance, setPreviousBalance] = useState("");
  const [regulerNomorRekening, setRegulerNomorRekening] = useState("");
  const [regulerNamaBank, setRegulerNamaBank] = useState("");
  const [regulerAtasNama, setRegulerAtasNama] = useState("");

  // Khusus-specific
  const [tempatTanggalLahir, setTempatTanggalLahir] = useState("");
  const [nomorKtp, setNomorKtp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [telepon, setTelepon] = useState("");
  const [namaIbuKandung, setNamaIbuKandung] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [unitKerja, setUnitKerja] = useState("");
  const [telpExt, setTelpExt] = useState("");
  const [mulaiKerjaSejak, setMulaiKerjaSejak] = useState("");
  const [namaAtasan, setNamaAtasan] = useState("");
  const [penghasilanBruto, setPenghasilanBruto] = useState("");
  const [namaBank, setNamaBank] = useState("");
  const [nomorRekening, setNomorRekening] = useState("");
  const [atasNamaRekening, setAtasNamaRekening] = useState("");

  // Barang-specific
  const [barangUnitKerja, setBarangUnitKerja] = useState("");
  const [statusKepegawaian, setStatusKepegawaian] = useState("");
  const [jenisKebutuhan, setJenisKebutuhan] = useState("");
  const [merek, setMerek] = useState("");
  const [tipe, setTipe] = useState("");
  const [lainLain, setLainLain] = useState("");
  const [barangPreviousBalance, setBarangPreviousBalance] = useState("");
  const [barangNomorRekening, setBarangNomorRekening] = useState("");
  const [barangNamaBank, setBarangNamaBank] = useState("");
  const [barangAtasNama, setBarangAtasNama] = useState("");

  // Channeling-specific
  const [channelingAmount, setChannelingAmount] = useState("");
  const [channelingPurpose, setChannelingPurpose] = useState("");
  const [channelingDocumentFile, setChannelingDocumentFile] = useState<File | null>(null);
  const [channelingNomorRekening, setChannelingNomorRekening] = useState("");
  const [channelingNamaBank, setChannelingNamaBank] = useState("");
  const [channelingAtasNama, setChannelingAtasNama] = useState("");

  // Agreement (Syarat & Ketentuan)
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [loanBalanceTotal, setLoanBalanceTotal] = useState<number>(0);
  const [existingMonthlyInstallment, setExistingMonthlyInstallment] = useState<number>(0);
  const [installmentSource, setInstallmentSource] = useState<string>("estimated");
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const checkAuth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/member/login");
      return;
    }
    setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "User");
    setUserEmail(user.email || "");
    setAuthLoading(false);

    // Fetch loan balances and existing installments
    try {
      const [balRes, loansRes] = await Promise.all([
        fetch("/api/member-balances"),
        fetch("/api/loans"),
      ]);
      let saldoInstallment = 0;
      let source = "estimated";
      if (balRes.ok) {
        const data = await balRes.json();
        const total = data.pinjaman?.total || 0;
        setLoanBalanceTotal(total);
        if (total > 0) {
          setPreviousBalance(total.toString());
          setBarangPreviousBalance(total.toString());
        }
        saldoInstallment = data.pinjaman?.estimatedMonthlyInstallment || 0;
        source = data.pinjaman?.installmentSource || "estimated";
      }
      if (loansRes.ok) {
        const loansData = await loansRes.json();
        const activeLoans = (loansData.loans || []).filter(
          (l: { status: string }) => !["rejected", "draft", "selesai", "held"].includes(l.status)
        );
        const totalMonthly = activeLoans.reduce(
          (sum: number, l: { monthlyInstallment: string }) => sum + parseFloat(l.monthlyInstallment || "0"),
          0
        );
        // Combine: active system loans + imported saldo installments
        setExistingMonthlyInstallment(totalMonthly + saldoInstallment);
        setInstallmentSource(totalMonthly > 0 ? "app+" + source : source);
      } else {
        if (saldoInstallment > 0) {
          setExistingMonthlyInstallment(saldoInstallment);
          setInstallmentSource(source);
        }
      }
    } catch {
      // Silently ignore - balance fields remain editable
    }
  }, [router, supabase]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/member/login");
  }

  // ─── Select loan type ───────────────────────────────────────────────────────

  function handleSelectType(type: LoanType) {
    setLoanType(type);
    setAgreedToTerms(false);
    setStep("terms");
  }

  // ─── Build formData based on type ──────────────────────────────────────────

  function buildFormData(): Record<string, unknown> {
    const commonIncome = { penghasilanBruto: penghasilanBruto ? parseFloat(penghasilanBruto) : 0 };
    if (loanType === "reguler") {
      return {
        ...commonIncome,
        loanCriteria,
        musibahType: loanCriteria === "musibah" ? musibahType : undefined,
        requestMonth,
        previousLoanBalance: previousBalance ? parseFloat(previousBalance) : 0,
        nomorRekening: regulerNomorRekening,
        namaBank: regulerNamaBank,
        atasNamaRekening: regulerAtasNama,
      };
    }
    if (loanType === "khusus") {
      return {
        tempatTanggalLahir,
        nomorKtp,
        alamat,
        telepon,
        namaIbuKandung,
        jabatan,
        unitKerja,
        telpExt,
        mulaiKerjaSejak,
        namaAtasan,
        ...commonIncome,
        namaBank,
        nomorRekening,
        atasNamaRekening,
      };
    }
    if (loanType === "barang" || loanType === "travel" || loanType === "kepemilikan_kendaraan") {
      return {
        ...commonIncome,
        unitKerja: barangUnitKerja,
        statusKepegawaian,
        jenisKebutuhan,
        merek,
        tipe,
        lainLain,
        previousLoanBalance: barangPreviousBalance ? parseFloat(barangPreviousBalance) : 0,
        nomorRekening: barangNomorRekening,
        namaBank: barangNamaBank,
        atasNamaRekening: barangAtasNama,
      };
    }
    return {};
  }

  // ─── Submit handlers ───────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate penghasilan bruto is filled
    if (!penghasilanBruto || parseFloat(penghasilanBruto) <= 0) {
      setError("Penghasilan Bruto / Bulan wajib diisi");
      setLoading(false);
      return;
    }

    // 40% cicilan validation
    if (loanType && loanType !== "channeling" && loanType !== "barang") {
      const income = parseFloat(penghasilanBruto);
      const newInstallment = calculateMonthlyInstallment(
        parseFloat(amount),
        LOAN_TYPES[loanType as LoanType]?.rate || 0,
        parseInt(tenor)
      );
      const totalCicilan = existingMonthlyInstallment + newInstallment;
      const maxCicilan = income * 0.4;
      if (totalCicilan > maxCicilan) {
        setError("Pinjaman anda tidak dapat di proses karena jumlah cicilan melebihi 40% dari pendapatan bulanan anda. Silahkan hubungi tim Koperasi.");
        setLoading(false);
        return;
      }
    }

    if (!documentFile) {
      setError("Dokumen Pendukung wajib diupload");
      setLoading(false);
      return;
    }

    try {
      let documentUrls: string[] = [];
      const formData = new FormData();
      formData.append("file", documentFile);
      formData.append("type", "loan");
      const uploadRes = await fetch("/api/upload-document", { method: "POST", body: formData });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        documentUrls = [uploadData.url];
      }

      const config = LOAN_TYPES[loanType as LoanType];
      const isItemLoan = loanType === "barang" || loanType === "travel" || loanType === "kepemilikan_kendaraan";
      const loanAmount = isItemLoan ? 1 : parseFloat(amount);
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanType,
          amount: loanAmount,
          tenorMonths: parseInt(tenor),
          purpose,
          interestRate: config.rate,
          formData: buildFormData(),
          documentUrls: documentUrls.length > 0 ? documentUrls : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengajukan pinjaman");
      }

      const data = await res.json();
      setTrackingNumber(data.trackingNumber);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleChannelingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!channelingDocumentFile) {
      setError("Dokumen Pendukung wajib diupload");
      setLoading(false);
      return;
    }

    try {
      let documentUrls: string[] = [];
      const formData = new FormData();
      formData.append("file", channelingDocumentFile);
      formData.append("type", "loan");
      const uploadRes = await fetch("/api/upload-document", { method: "POST", body: formData });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        documentUrls = [uploadData.url];
      }

      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanType: "channeling",
          amount: channelingAmount ? parseFloat(channelingAmount) : 1,
          tenorMonths: 1,
          purpose: channelingPurpose || "Pinjaman Channeling (Mandiri & BSI)",
          interestRate: 0,
          documentUrls: documentUrls.length > 0 ? documentUrls : undefined,
          formData: {
            channelingAmount: channelingAmount ? parseFloat(channelingAmount) : undefined,
            channelingPurpose,
            nomorRekening: channelingNomorRekening,
            namaBank: channelingNamaBank,
            atasNamaRekening: channelingAtasNama,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan data");
      }

      const data = await res.json();
      setTrackingNumber(data.trackingNumber);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  // ─── Calculated values ─────────────────────────────────────────────────────

  const selectedLoan = loanType ? LOAN_TYPES[loanType as LoanType] : null;
  const interestRate = selectedLoan ? selectedLoan.rate : 0;
  const isItemLoan = loanType === "barang" || loanType === "travel" || loanType === "kepemilikan_kendaraan";
  const monthlyInstallment =
    amount && tenor && loanType && loanType !== "channeling"
      ? calculateMonthlyInstallment(parseFloat(amount), interestRate, parseInt(tenor))
      : 0;
  const totalRepayment = monthlyInstallment * (parseInt(tenor) || 0);

  // 40% income ratio calculation
  const incomeValue = penghasilanBruto ? parseFloat(penghasilanBruto) : 0;
  const totalCicilanWithNew = existingMonthlyInstallment + monthlyInstallment;
  const maxAllowedCicilan = incomeValue * 0.4;
  const cicilanExceeds40 = incomeValue > 0 && !isItemLoan && monthlyInstallment > 0 && totalCicilanWithNew > maxAllowedCicilan;

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ─── Success Screen ────────────────────────────────────────────────────────

  if (step === "success") {
    const isChannelingSuccess = loanType === "channeling";

    return (
      <DashboardLayout variant="member" userName={userName} userEmail={userEmail} onLogout={handleLogout}>
        <div className="max-w-lg mx-auto py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isChannelingSuccess ? "Data Tersimpan!" : "Pengajuan Berhasil!"}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {isChannelingSuccess
                ? "Data pinjaman channeling Anda telah tersimpan."
                : "Pengajuan pinjaman Anda telah diterima dan sedang diproses."}
            </p>

            {trackingNumber && (
              <div className="bg-[#f0f0f0] rounded-2xl p-5 mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nomor Tracking</p>
                <p className="text-xl font-mono font-bold text-teal-600">{trackingNumber}</p>
              </div>
            )}

            {isChannelingSuccess ? (
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6 mb-8 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <Phone className="w-5 h-5 text-sky-600" />
                  <p className="text-sm font-semibold text-sky-900">Hubungi Tim Koperasi</p>
                </div>
                <p className="text-sm text-sky-800">
                  Untuk melanjutkan proses pinjaman channeling, silakan hubungi Tim Koperasi Pegawai BKI di nomor:
                </p>
                <p className="text-2xl font-bold text-sky-700 mt-3">08111111111</p>
                <p className="text-xs text-sky-600 mt-2">* Nomor ini akan diperbarui</p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left">
                <p className="text-sm font-semibold text-gray-900 mb-3">Alur Persetujuan:</p>
                <div className="space-y-3">
                  {[
                    "Staf Sekper (Review & Analisa Kredit)",
                    "Manager (Review & Evaluasi Keuangan)",
                    "Bendahara (Review & Evaluasi Keuangan)",
                    "Ketua (Persetujuan Akhir)",
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-sm text-gray-600">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/member/loans"
              className="inline-flex items-center gap-2 bg-teal-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-teal-600 transition-all shadow-lg shadow-teal-200"
            >
              Lihat Pinjaman Saya
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Terms & Conditions ──────────────────────────────────────────────────

  const TERMS_BY_TYPE: Record<LoanType, { title: string; items: string[] }> = {
    reguler: {
      title: "Syarat & Ketentuan Pinjaman Reguler",
      items: [
        "Plafon maks: Rp 25.000.000",
        "Tenor maks: 10 bulan",
        "Biaya administrasi: 1% dari pinjaman",
        "Simpanan Khusus: 1% dari pinjaman",
        "Dokumen: Fotokopi KTP, slip gaji terbaru, bukti alasan meminjam",
        "Seluruh informasi yang diberikan harus benar dan dapat diverifikasi oleh Koperasi.",
        "Pemohon menyetujui pemotongan gaji untuk angsuran dan mengotorisasi PT BKI untuk memproses.",
        "Apabila keanggotaan atau kepegawaian berakhir, sisa pinjaman akan dipotong dari pesangon/pensiun.",
        "Pemohon setuju mematuhi seluruh prosedur Koperasi; Koperasi dapat menyetujui/menolak tanpa penjelasan.",
      ],
    },
    khusus: {
      title: "Syarat & Ketentuan Pinjaman Khusus",
      items: [
        "Harus Pegawai Tetap PT BKI",
        "Plafon maks: Rp 100.000.000",
        "Tenor maks: 60 bulan (5 tahun)",
        "Imbal Jasa: 7.5% per tahun (flat)",
        "Asuransi wajib jika > Rp 25 juta",
        "Angsuran min 40% dari gaji",
        "Dokumen: KTP, KK, slip gaji, bukti alasan meminjam",
        "Seluruh informasi yang diberikan harus benar dan dapat diverifikasi oleh Koperasi.",
        "Pemohon menyetujui pemotongan gaji untuk angsuran dan mengotorisasi PT BKI untuk memproses.",
        "Apabila keanggotaan atau kepegawaian berakhir, sisa pinjaman akan dipotong dari pesangon/pensiun.",
        "Pemohon setuju mematuhi seluruh prosedur Koperasi; Koperasi dapat menyetujui/menolak tanpa penjelasan.",
      ],
    },
    barang: {
      title: "Syarat & Ketentuan Pinjaman Barang",
      items: [
        "Pinjaman untuk pembelian barang konsumsi.",
        "Harga barang akan ditentukan oleh Pengurus.",
        "Pemohon berjanji akan mematuhi ketentuan pinjaman yang ditetapkan Koperasi Pegawai BKI.",
        "Apabila pemohon tidak lagi menjadi anggota / pegawai PT BKI, seluruh hutang akan dilunasi sekaligus.",
        "Seluruh informasi yang diberikan harus benar dan dapat diverifikasi oleh Koperasi.",
      ],
    },
    travel: {
      title: "Syarat & Ketentuan Pinjaman Travel",
      items: [
        "Pinjaman untuk keperluan perjalanan (travel).",
        "Harga paket akan ditentukan oleh Pengurus.",
        "Pemohon berjanji akan mematuhi ketentuan pinjaman yang ditetapkan Koperasi Pegawai BKI.",
        "Apabila pemohon tidak lagi menjadi anggota / pegawai PT BKI, seluruh hutang akan dilunasi sekaligus.",
        "Seluruh informasi yang diberikan harus benar dan dapat diverifikasi oleh Koperasi.",
      ],
    },
    kepemilikan_kendaraan: {
      title: "Syarat & Ketentuan Pinjaman Kepemilikan Kendaraan",
      items: [
        "Pinjaman untuk pembelian kendaraan bermotor.",
        "Harga kendaraan akan ditentukan oleh Pengurus.",
        "Pemohon berjanji akan mematuhi ketentuan pinjaman yang ditetapkan Koperasi Pegawai BKI.",
        "Apabila pemohon tidak lagi menjadi anggota / pegawai PT BKI, seluruh hutang akan dilunasi sekaligus.",
        "Seluruh informasi yang diberikan harus benar dan dapat diverifikasi oleh Koperasi.",
      ],
    },
    channeling: {
      title: "Syarat & Ketentuan Pinjaman Channeling",
      items: [
        "Pinjaman channeling melalui Bank Mandiri & BSI.",
        "Setelah menyimpan data, silakan hubungi Tim Koperasi Pegawai BKI untuk melanjutkan proses.",
        "Seluruh informasi yang diberikan harus benar dan dapat diverifikasi oleh Koperasi.",
        "Pemohon setuju mematuhi seluruh prosedur Koperasi; Koperasi dapat menyetujui/menolak tanpa penjelasan.",
      ],
    },
  };

  if (step === "terms" && loanType) {
    const termsConfig = TERMS_BY_TYPE[loanType as LoanType];
    const loanConfig = LOAN_TYPES[loanType as LoanType];
    return (
      <DashboardLayout variant="member" userName={userName} userEmail={userEmail} onLogout={handleLogout}>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => { setStep("select"); setLoanType(""); }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali pilih jenis pinjaman
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className={`w-11 h-11 rounded-xl ${loanConfig.colors.bg} flex items-center justify-center`}>
              <span className={loanConfig.colors.icon}>{loanConfig.icon}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{termsConfig.title}</h1>
              <p className="text-sm text-gray-500">Baca dan setujui sebelum melanjutkan</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 max-h-80 overflow-y-auto">
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                {termsConfig.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 text-teal-500 focus:ring-teal-500 rounded"
              />
              <span className="text-sm text-gray-900">
                Saya telah membaca dan menyetujui seluruh Syarat & Ketentuan di atas.
              </span>
            </label>

            <button
              type="button"
              disabled={!agreedToTerms}
              onClick={() => {
                if (loanType === "channeling") {
                  setStep("channeling");
                } else {
                  setStep("form");
                }
              }}
              className="w-full bg-teal-500 text-white py-3.5 rounded-xl font-semibold hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-200"
            >
              <ArrowRight className="w-4 h-4" />
              Lanjutkan Pengisian Formulir
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Channeling Form ───────────────────────────────────────────────────────

  if (step === "channeling") {
    return (
      <DashboardLayout variant="member" userName={userName} userEmail={userEmail} onLogout={handleLogout}>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => { setStep("select"); setLoanType(""); }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali pilih jenis pinjaman
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-sky-100 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pinjaman Channeling</h1>
              <p className="text-sm text-gray-500">Melalui Bank Mandiri & BSI</p>
            </div>
          </div>

          <form onSubmit={handleChannelingSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Perkiraan Jumlah Pinjaman (Rp) - Opsional</label>
                <input
                  type="number"
                  value={channelingAmount}
                  onChange={(e) => setChannelingAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all outline-none"
                  placeholder="Masukkan perkiraan jumlah"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tujuan Pinjaman - Opsional</label>
                <textarea
                  value={channelingPurpose}
                  onChange={(e) => setChannelingPurpose(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all outline-none resize-none"
                  placeholder="Jelaskan tujuan pinjaman..."
                />
              </div>
            </div>

            {/* ── Bank Account Info ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <h2 className="font-semibold text-gray-900">Data Rekening</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Rekening *</label>
                  <input
                    type="text"
                    value={channelingNomorRekening}
                    onChange={(e) => setChannelingNomorRekening(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all outline-none"
                    placeholder="Nomor rekening"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Bank *</label>
                  <input
                    type="text"
                    value={channelingNamaBank}
                    onChange={(e) => setChannelingNamaBank(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all outline-none"
                    placeholder="Nama bank"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Atas Nama Rekening *</label>
                  <input
                    type="text"
                    value={channelingAtasNama}
                    onChange={(e) => setChannelingAtasNama(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all outline-none"
                    placeholder="Nama pemilik rekening"
                  />
                </div>
              </div>
            </div>

            {/* ── Document Upload ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Dokumen Pendukung (Wajib) *</h2>
              <p className="text-xs text-gray-500 mb-3">
                Upload dokumen pendukung seperti slip gaji, KTP, KK, atau dokumen lainnya (PDF, maks 5MB).
              </p>
              <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-sky-400 hover:bg-sky-50/50 transition-all">
                <Upload className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  {channelingDocumentFile ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{channelingDocumentFile.name}</span>
                      <span className="text-xs text-gray-400">({(channelingDocumentFile.size / 1024).toFixed(0)} KB)</span>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setChannelingDocumentFile(null); }}
                        className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Klik untuk memilih file PDF</span>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 5 * 1024 * 1024) setChannelingDocumentFile(file);
                    else if (file) alert("Ukuran file maks 5MB");
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5">
              <div className="flex gap-3">
                <Phone className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-sky-900 mb-1">Informasi Penting</p>
                  <p className="text-sm text-sky-800">
                    Setelah menyimpan data, silakan hubungi Tim Koperasi Pegawai BKI untuk melanjutkan proses pinjaman channeling.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 text-white py-3.5 rounded-xl font-semibold hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-200"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Simpan & Lanjutkan
                </>
              )}
            </button>
          </form>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Type Selection ────────────────────────────────────────────────────────

  if (step === "select") {
    return (
      <DashboardLayout variant="member" userName={userName} userEmail={userEmail} onLogout={handleLogout}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pengajuan Pinjaman</h1>
              <p className="text-sm text-gray-500">Pilih jenis pinjaman yang sesuai</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.entries(LOAN_TYPES) as [LoanType, LoanTypeConfig][]).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectType(key)}
                className={`p-6 rounded-2xl text-left transition-all border-2 border-gray-100 hover:${config.colors.border} hover:${config.colors.bg} group`}
              >
                <div className={`mb-3 text-gray-400 group-hover:${config.colors.icon}`}>
                  {config.icon}
                </div>
                <p className={`font-semibold text-gray-900 group-hover:${config.colors.text}`}>
                  {config.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-teal-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Pilih <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Form (Reguler / Khusus / Barang) ──────────────────────────────────────

  const config = LOAN_TYPES[loanType as LoanType];

  return (
    <DashboardLayout variant="member" userName={userName} userEmail={userEmail} onLogout={handleLogout}>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => { setStep("select"); setLoanType(""); }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali pilih jenis pinjaman
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className={`w-11 h-11 rounded-xl ${config.colors.bg} flex items-center justify-center`}>
            <span className={config.colors.icon}>{config.icon}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{config.label}</h1>
            <p className="text-sm text-gray-500">{config.description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Common: Amount & Tenor ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Data Pinjaman</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!isItemLoan && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Pinjaman (Rp) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="100000"
                    max={config.maxAmount || undefined}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none"
                    placeholder={config.maxAmount ? `Maks ${formatCurrency(config.maxAmount)}` : "Masukkan jumlah"}
                  />
                  {config.maxAmount && (
                    <p className="text-xs text-gray-400 mt-1">Maks: {formatCurrency(config.maxAmount)}</p>
                  )}
                </div>
              )}
              {isItemLoan && (
                <div>
                  <p className="block text-sm font-medium text-gray-700 mb-2">
                    {loanType === "travel" ? "Harga Paket" : loanType === "kepemilikan_kendaraan" ? "Harga Kendaraan" : "Harga Barang"}
                  </p>
                  <p className="text-sm text-gray-500 italic py-3">Akan ditentukan oleh Pengurus</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tenor (bulan) *</label>
                <select
                  value={tenor}
                  onChange={(e) => setTenor(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none"
                >
                  <option value="">Pilih tenor</option>
                  {getTenorOptions(loanType as LoanType).map((t) => (
                    <option key={t} value={t}>{t} bulan</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Penghasilan Bruto (required for all non-channeling types) ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Penghasilan Bruto / Bulan (Rp) *</label>
              <input
                type="number"
                value={penghasilanBruto}
                onChange={(e) => setPenghasilanBruto(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none"
                placeholder="Contoh: 15000000"
              />
              <p className="text-xs text-gray-400 mt-1">Gaji kotor per bulan sebelum potongan</p>
            </div>

            {/* ── 40% Cicilan Warning ── */}
            {cicilanExceeds40 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-1">Cicilan Melebihi 40% Pendapatan</p>
                  <p className="text-xs text-red-700">
                    Total cicilan ({formatCurrency(totalCicilanWithNew)}) melebihi 40% dari pendapatan bulanan ({formatCurrency(maxAllowedCicilan)}).
                    Pinjaman tidak dapat diproses.
                  </p>
                  {existingMonthlyInstallment > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Cicilan existing: {formatCurrency(existingMonthlyInstallment)}/bln + pengajuan baru: {formatCurrency(monthlyInstallment)}/bln
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Cicilan Ratio Info ── */}
            {incomeValue > 0 && monthlyInstallment > 0 && !isItemLoan && !cicilanExceeds40 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs text-green-700">
                  Rasio cicilan: {formatCurrency(totalCicilanWithNew)} / {formatCurrency(maxAllowedCicilan)} (maks 40% pendapatan)
                  {existingMonthlyInstallment > 0 && (
                    <span className="block mt-1 text-green-600">
                      Termasuk cicilan pinjaman aktif: {formatCurrency(existingMonthlyInstallment)}/bulan
                      {installmentSource.includes("potongan")
                        ? " (dari data potongan gaji)"
                        : installmentSource.includes("excel_angsuran")
                        ? " (dari data angsuran Excel)"
                        : installmentSource.includes("estimated")
                        ? " (estimasi dari saldo)"
                        : ""}
                    </span>
                  )}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tujuan Pinjaman *</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none resize-none"
                placeholder="Jelaskan tujuan pinjaman..."
              />
            </div>
          </div>

          {/* ── Reguler-specific fields ─────────────────────────────────────── */}
          {loanType === "reguler" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <h2 className="font-semibold text-gray-900">Kriteria Pinjaman Reguler</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kriteria Pinjaman *</label>
                <div className="space-y-2">
                  {LOAN_CRITERIA.map((c) => (
                    <label key={c.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${loanCriteria === c.value ? "border-teal-300 bg-teal-50" : "border-gray-200 hover:bg-gray-50"}`}>
                      <input
                        type="radio"
                        name="loanCriteria"
                        value={c.value}
                        checked={loanCriteria === c.value}
                        onChange={(e) => setLoanCriteria(e.target.value)}
                        className="text-teal-500 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-900">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {loanCriteria === "musibah" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Musibah *</label>
                  <select
                    value={musibahType}
                    onChange={(e) => setMusibahType(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none"
                  >
                    <option value="">Pilih jenis musibah</option>
                    {MUSIBAH_TYPES.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dalam Bulan</label>
                  <input
                    type="month"
                    value={requestMonth}
                    onChange={(e) => setRequestMonth(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sisa Pinjaman yang Lalu (Rp)</label>
                  <input
                    type="number"
                    value={previousBalance}
                    onChange={(e) => setPreviousBalance(e.target.value)}
                    readOnly={loanBalanceTotal > 0}
                    min="0"
                    className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all outline-none ${loanBalanceTotal > 0 ? "bg-gray-100 text-gray-600 cursor-not-allowed" : "bg-[#f0f0f0] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white"}`}
                    placeholder="0"
                  />
                  {loanBalanceTotal > 0 && (
                    <p className="text-xs text-teal-600 mt-1">Otomatis dari saldo pinjaman Anda</p>
                  )}
                </div>
              </div>

              {/* ── Bank Account Info ── */}
              <h2 className="font-semibold text-gray-900 pt-2">Data Rekening</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Rekening *</label>
                  <input
                    type="text"
                    value={regulerNomorRekening}
                    onChange={(e) => setRegulerNomorRekening(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none"
                    placeholder="Nomor rekening"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Bank *</label>
                  <input
                    type="text"
                    value={regulerNamaBank}
                    onChange={(e) => setRegulerNamaBank(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none"
                    placeholder="Nama bank"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Atas Nama Rekening *</label>
                  <input
                    type="text"
                    value={regulerAtasNama}
                    onChange={(e) => setRegulerAtasNama(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none"
                    placeholder="Nama pemilik rekening"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Khusus-specific fields ──────────────────────────────────────── */}
          {loanType === "khusus" && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                <h2 className="font-semibold text-gray-900">Data Pribadi Pemohon</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tempat & Tanggal Lahir *</label>
                    <input
                      type="text"
                      value={tempatTanggalLahir}
                      onChange={(e) => setTempatTanggalLahir(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all outline-none"
                      placeholder="Jakarta, 01-01-1990"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nomor KTP *</label>
                    <input
                      type="text"
                      value={nomorKtp}
                      onChange={(e) => setNomorKtp(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all outline-none"
                      placeholder="Copy KTP terlampir"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Rumah / Kode Pos *</label>
                    <input
                      type="text"
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all outline-none"
                      placeholder="Alamat lengkap"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telepon / Handphone *</label>
                    <input
                      type="text"
                      value={telepon}
                      onChange={(e) => setTelepon(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all outline-none"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Ibu Kandung *</label>
                    <input
                      type="text"
                      value={namaIbuKandung}
                      onChange={(e) => setNamaIbuKandung(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all outline-none"
                      placeholder="Copy KK terlampir"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                <h2 className="font-semibold text-gray-900">Data Pekerjaan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jabatan Saat Ini *</label>
                    <input
                      type="text"
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit Kerja / Produksi *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={unitKerja}
                        onChange={(e) => setUnitKerja(e.target.value)}
                        required
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all outline-none"
                      />
                      <input
                        type="text"
                        value={telpExt}
                        onChange={(e) => setTelpExt(e.target.value)}
                        className="w-24 border border-gray-200 rounded-xl px-3 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all outline-none"
                        placeholder="Ext."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mulai Kerja Sejak *</label>
                    <input
                      type="date"
                      value={mulaiKerjaSejak}
                      onChange={(e) => setMulaiKerjaSejak(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Atasan Langsung *</label>
                    <input
                      type="text"
                      value={namaAtasan}
                      onChange={(e) => setNamaAtasan(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                <h2 className="font-semibold text-gray-900">Data Keuangan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Bank *</label>
                    <input
                      type="text"
                      value={namaBank}
                      onChange={(e) => setNamaBank(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Rekening *</label>
                    <input
                      type="text"
                      value={nomorRekening}
                      onChange={(e) => setNomorRekening(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Atas Nama Rekening *</label>
                    <input
                      type="text"
                      value={atasNamaRekening}
                      onChange={(e) => setAtasNamaRekening(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all outline-none"
                      placeholder="Nama pemilik rekening"
                    />
                  </div>
                </div>
              </div>

              {/* Declarations */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-3">Pernyataan Pemohon</h2>
                <div className="space-y-2 text-xs text-gray-600">
                  <p>1. Seluruh informasi yang saya berikan adalah benar dan saya mengotorisasi Koperasi untuk melakukan verifikasi.</p>
                  <p>2. Saya menyetujui pemotongan gaji untuk angsuran dan mengotorisasi PT BKI untuk memproses.</p>
                  <p>3. Apabila keanggotaan atau kepegawaian berakhir, sisa pinjaman akan dipotong dari pesangon/pensiun.</p>
                  <p>4. Saya setuju mematuhi seluruh prosedur Koperasi; Koperasi dapat menyetujui/menolak tanpa penjelasan.</p>
                </div>
              </div>
            </>
          )}

          {/* ── Barang/Travel/Kendaraan-specific fields ────────────────────── */}
          {isItemLoan && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <h2 className="font-semibold text-gray-900">
                {loanType === "travel" ? "Data Pinjaman Travel" : loanType === "kepemilikan_kendaraan" ? "Data Pinjaman Kendaraan" : "Data Pinjaman Barang"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit Kerja *</label>
                  <input
                    type="text"
                    value={barangUnitKerja}
                    onChange={(e) => setBarangUnitKerja(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status Kepegawaian *</label>
                  <select
                    value={statusKepegawaian}
                    onChange={(e) => setStatusKepegawaian(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all outline-none"
                  >
                    <option value="">Pilih status</option>
                    <option value="Pegawai Tetap">Pegawai Tetap</option>
                    <option value="Pegawai Kontrak">Pegawai Kontrak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kebutuhan *</label>
                  <input
                    type="text"
                    value={jenisKebutuhan}
                    onChange={(e) => setJenisKebutuhan(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all outline-none"
                    placeholder="Laptop, Handphone, dll"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Merek *</label>
                  <input
                    type="text"
                    value={merek}
                    onChange={(e) => setMerek(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all outline-none"
                    placeholder="Apple, Lenovo, dll"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipe / Model *</label>
                  <input
                    type="text"
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all outline-none"
                    placeholder="Model / seri"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sisa Pinjaman Lalu (Rp)</label>
                  <input
                    type="number"
                    value={barangPreviousBalance}
                    onChange={(e) => setBarangPreviousBalance(e.target.value)}
                    readOnly={loanBalanceTotal > 0}
                    min="0"
                    className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all outline-none ${loanBalanceTotal > 0 ? "bg-gray-100 text-gray-600 cursor-not-allowed" : "bg-[#f0f0f0] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white"}`}
                    placeholder="0"
                  />
                  {loanBalanceTotal > 0 && (
                    <p className="text-xs text-purple-600 mt-1">Otomatis dari saldo pinjaman Anda</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan Lain-lain</label>
                  <textarea
                    value={lainLain}
                    onChange={(e) => setLainLain(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all outline-none resize-none"
                    placeholder="Spesifikasi atau detail tambahan"
                  />
                </div>
              </div>

              {/* ── Bank Account Info ── */}
              <h2 className="font-semibold text-gray-900 pt-2">Data Rekening</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Rekening *</label>
                  <input
                    type="text"
                    value={barangNomorRekening}
                    onChange={(e) => setBarangNomorRekening(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all outline-none"
                    placeholder="Nomor rekening"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Bank *</label>
                  <input
                    type="text"
                    value={barangNamaBank}
                    onChange={(e) => setBarangNamaBank(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all outline-none"
                    placeholder="Nama bank"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Atas Nama Rekening *</label>
                  <input
                    type="text"
                    value={barangAtasNama}
                    onChange={(e) => setBarangAtasNama(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all outline-none"
                    placeholder="Nama pemilik rekening"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Simulation ─────────────────────────────────────────────────── */}
          {monthlyInstallment > 0 && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 p-6 text-white shadow-lg shadow-teal-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-teal-200" />
                  <h2 className="font-semibold text-teal-100">Simulasi Angsuran</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-teal-200 mb-1">Pagu Pinjaman</p>
                    <p className="font-bold text-lg">{formatCurrency(parseFloat(amount))}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-teal-200 mb-1">Imbal Jasa</p>
                    <p className="font-bold text-lg">{interestRate}% / tahun</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-teal-200 mb-1">Angsuran / Bulan</p>
                    <p className="font-bold text-xl">{formatCurrency(monthlyInstallment)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-teal-200 mb-1">Total Pengembalian</p>
                    <p className="font-bold text-lg">{formatCurrency(totalRepayment)}</p>
                  </div>
                </div>

                {/* ── Biaya-biaya ── */}
                <div className="mt-4 border-t border-white/20 pt-4">
                  <h3 className="text-sm font-semibold text-teal-100 mb-3">Biaya-biaya</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-teal-200">Biaya Administrasi (1%)</span>
                      <span className="font-semibold">{formatCurrency(parseFloat(amount) * 0.01)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-teal-200">Simpanan Khusus (1%)</span>
                      <span className="font-semibold">{formatCurrency(parseFloat(amount) * 0.01)}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/20 pt-2">
                      <span className="text-teal-100 font-medium">Total Potongan</span>
                      <span className="font-bold">{formatCurrency(parseFloat(amount) * 0.02)}</span>
                    </div>
                    <div className="flex justify-between bg-white/10 rounded-lg px-3 py-2 -mx-1">
                      <span className="text-white font-medium">Dana Diterima</span>
                      <span className="font-bold text-lg">{formatCurrency(parseFloat(amount) * 0.98)}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-teal-300 mt-2">
                    * Biaya administrasi dipotong 1% dan Simpanan Khusus 1% dari Pagu Pinjaman
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Document Upload ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Dokumen Pendukung (Wajib) *</h2>
            <p className="text-xs text-gray-500 mb-3">
              Upload dokumen pendukung seperti slip gaji, KTP, KK, atau dokumen lainnya (PDF, maks 5MB).
            </p>
            <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-all">
              <Upload className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                {documentFile ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{documentFile.name}</span>
                    <span className="text-xs text-gray-400">({(documentFile.size / 1024).toFixed(0)} KB)</span>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setDocumentFile(null); }}
                      className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Klik untuk memilih file PDF</span>
                )}
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size <= 5 * 1024 * 1024) setDocumentFile(file);
                  else if (file) alert("Ukuran file maks 5MB");
                }}
                className="hidden"
              />
            </label>
          </div>

          {/* ── Approval Info ───────────────────────────────────────────────── */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Setelah diajukan, pinjaman akan direview oleh Staf Sekper (analisa kredit), Manager, Bendahara,
              dan Ketua untuk persetujuan akhir. Formulir dapat diunduh sebelum persetujuan Ketua dan proses SPP.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !loanType || (!amount && !isItemLoan) || !tenor || !documentFile || !penghasilanBruto || cicilanExceeds40}
            className="w-full bg-teal-500 text-white py-3.5 rounded-xl font-semibold hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-200 hover:shadow-teal-300"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Ajukan Pinjaman
              </>
            )}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
