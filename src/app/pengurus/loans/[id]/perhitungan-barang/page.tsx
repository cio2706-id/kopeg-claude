"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowLeft,
  Package,
  Calculator,
  Printer,
  Save,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  formatCurrency,
  LOAN_TYPE_LABELS,
  calculateMonthlyInstallment,
  generateInstallmentSchedule,
} from "@/lib/utils";

interface LoanDetail {
  id: string;
  trackingNumber: string;
  loanType: string;
  amount: string;
  interestRate: string;
  tenorMonths: number;
  monthlyInstallment: string;
  status: string;
  disbursedAt: string | null;
  createdAt: string;
  formData: Record<string, unknown> | null;
}

interface Requester {
  fullName: string;
  email: string;
  department: string | null;
  employeeId: string | null;
}

export default function PerhitunganPinjamanBarangPage() {
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [requester, setRequester] = useState<Requester | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Editable fields for calculation
  const [goodsPrice, setGoodsPrice] = useState("");
  const [tenor, setTenor] = useState("");
  const [interestRate, setInterestRate] = useState("8");

  const router = useRouter();
  const params = useParams();
  const loanId = params.id as string;
  const supabase = createSupabaseBrowserClient();

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/pengurus/login");
      return;
    }
    setUserName(
      user.user_metadata?.full_name || user.email?.split("@")[0] || "Pengurus"
    );
    setUserEmail(user.email || "");

    try {
      const res = await fetch(`/api/loans/${loanId}`);
      if (!res.ok) {
        router.push("/pengurus/loans");
        return;
      }
      const data = await res.json();
      setLoan(data.loan);
      setRequester(data.requester);

      // Pre-fill from existing loan data
      const amount = parseFloat(data.loan.amount);
      if (amount > 1) {
        setGoodsPrice(amount.toString());
      }
      setTenor(data.loan.tenorMonths.toString());
      setInterestRate(data.loan.interestRate);
    } catch (error) {
      console.error("Failed to load loan:", error);
    } finally {
      setLoading(false);
    }
  }, [router, supabase, loanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/pengurus/login");
  }

  // Calculated values
  const price = parseFloat(goodsPrice) || 0;
  const tenorMonths = parseInt(tenor) || 0;
  const rate = parseFloat(interestRate) || 0;

  const adminFee = Math.round(price * 0.01);
  const simpananKhusus = Math.round(price * 0.01);
  const totalPotongan = adminFee + simpananKhusus;
  const netDisbursement = price - totalPotongan;

  const monthlyInstallment =
    price > 0 && tenorMonths > 0
      ? calculateMonthlyInstallment(price, rate, tenorMonths)
      : 0;

  const totalRepayment = monthlyInstallment * tenorMonths;
  const totalInterest = totalRepayment - price;

  // Generate schedule preview
  const schedule =
    price > 0 && tenorMonths > 0
      ? generateInstallmentSchedule(price, rate, tenorMonths, new Date())
      : [];

  // Form data from loan
  const fd = loan?.formData || {};

  async function handleSave() {
    if (price <= 0 || tenorMonths <= 0) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/loans/${loanId}/perhitungan-barang`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: price,
          tenorMonths,
          interestRate: rate,
          monthlyInstallment: Math.round(monthlyInstallment),
        }),
      });

      if (res.ok) {
        loadData();
        alert("Perhitungan berhasil disimpan!");
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyimpan perhitungan");
      }
    } catch {
      alert("Gagal menyimpan perhitungan");
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading || !loan) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat data pinjaman...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      variant="pengurus"
      userName={userName}
      userEmail={userEmail}
      onLogout={handleLogout}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/pengurus/loans"
            className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Perhitungan Pinjaman Barang
            </h1>
            <p className="text-sm text-gray-500">{loan.trackingNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Loan & Goods Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Goods Info Card */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-gray-900">Data Barang</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                  Pemohon
                </p>
                <p className="font-semibold text-gray-900">
                  {requester?.fullName || "-"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                  NIP
                </p>
                <p className="font-semibold text-gray-900">
                  {requester?.employeeId || "-"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                  Unit Kerja
                </p>
                <p className="font-semibold text-gray-900">
                  {String(fd.unitKerja || requester?.department || "-")}
                </p>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                  Jenis Kebutuhan
                </p>
                <p className="font-semibold text-gray-900">
                  {String(fd.jenisKebutuhan || "-")}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                  Merek
                </p>
                <p className="font-semibold text-gray-900">
                  {String(fd.merek || "-")}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                  Tipe
                </p>
                <p className="font-semibold text-gray-900">
                  {String(fd.tipe || "-")}
                </p>
              </div>
              {!!fd.lainLain && (
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                    Lain-lain
                  </p>
                  <p className="font-semibold text-gray-900">
                    {String(fd.lainLain)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                  Status Kepegawaian
                </p>
                <p className="font-semibold text-gray-900">
                  {String(fd.statusKepegawaian || "-")}
                </p>
              </div>
            </div>
          </div>

          {/* Calculation Input Card */}
          <div className="bg-white rounded-2xl shadow-sm p-5 print:hidden">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-teal-600" />
              <h2 className="font-semibold text-gray-900">Input Perhitungan</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Harga Barang (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={goodsPrice}
                  onChange={(e) => setGoodsPrice(e.target.value)}
                  placeholder="Masukkan harga barang..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-300 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Tenor (Bulan)
                </label>
                <select
                  value={tenor}
                  onChange={(e) => setTenor(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-300 outline-none"
                >
                  <option value="">Pilih tenor</option>
                  {[3, 6, 10, 12, 18, 24, 36].map((m) => (
                    <option key={m} value={m}>
                      {m} bulan
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Imbal Jasa (% / tahun)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-300 outline-none"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving || price <= 0 || tenorMonths <= 0}
                className="w-full inline-flex items-center justify-center gap-2 bg-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-600 transition shadow-lg shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Simpan Perhitungan
              </button>
            </div>
          </div>
        </div>

        {/* Right: Calculation Result */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm print:shadow-none print:rounded-none">
            {/* Print Header */}
            <div className="border-b border-gray-200 p-6 print:p-4">
              <div className="text-center mb-4 hidden print:block">
                <h1 className="text-base font-bold">
                  KOPERASI PEGAWAI BIRO KLASIFIKASI INDONESIA
                </h1>
                <p className="text-[10px]">
                  Badan Hukum No. 2182/BH/DK.10.14/VII/2000
                </p>
                <p className="text-[10px]">
                  Jl. Yos Sudarso 38-40 Tanjung Priok, Jakarta 14320
                </p>
                <div className="border-b-2 border-black mt-2 mb-3" />
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center print:hidden">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 print:text-base">
                    PERHITUNGAN PINJAMAN BARANG
                  </h2>
                  <p className="text-sm text-gray-500 print:text-xs">
                    No. {loan.trackingNumber}
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                    Nama Peminjam
                  </p>
                  <p className="font-semibold text-gray-900">
                    {requester?.fullName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                    NIP
                  </p>
                  <p className="font-semibold text-gray-900">
                    {requester?.employeeId || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                    Jenis Barang
                  </p>
                  <p className="font-semibold text-gray-900">
                    {String(fd.jenisKebutuhan || "-")} -{" "}
                    {String(fd.merek || "")} {String(fd.tipe || "")}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="border-b border-gray-200 p-6 print:p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Ringkasan Perhitungan
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="bg-purple-50 rounded-lg p-3 print:bg-transparent print:border print:border-gray-200">
                  <p className="text-[11px] text-gray-400">Harga Barang</p>
                  <p className="font-bold text-gray-900">
                    {formatCurrency(price)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 print:bg-transparent print:border print:border-gray-200">
                  <p className="text-[11px] text-gray-400">
                    Biaya Admin (1%)
                  </p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(adminFee)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 print:bg-transparent print:border print:border-gray-200">
                  <p className="text-[11px] text-gray-400">
                    Simpanan Khusus (1%)
                  </p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(simpananKhusus)}
                  </p>
                </div>
                <div className="bg-teal-50 rounded-lg p-3 print:bg-transparent print:border print:border-teal-300">
                  <p className="text-[11px] text-gray-400">Dana Diterima</p>
                  <p className="font-bold text-teal-700">
                    {formatCurrency(netDisbursement)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-4">
                <div className="bg-gray-50 rounded-lg p-3 print:bg-transparent print:border print:border-gray-200">
                  <p className="text-[11px] text-gray-400">Imbal Jasa</p>
                  <p className="font-semibold text-gray-900">{rate}% / tahun</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 print:bg-transparent print:border print:border-gray-200">
                  <p className="text-[11px] text-gray-400">Jangka Waktu</p>
                  <p className="font-semibold text-gray-900">
                    {tenorMonths} bulan
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 print:bg-transparent print:border print:border-blue-300">
                  <p className="text-[11px] text-gray-400">Angsuran / Bulan</p>
                  <p className="font-bold text-blue-700">
                    {formatCurrency(Math.round(monthlyInstallment))}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 print:bg-transparent print:border print:border-gray-200">
                  <p className="text-[11px] text-gray-400">
                    Total Pengembalian
                  </p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(Math.round(totalRepayment))}
                  </p>
                </div>
              </div>
            </div>

            {/* Schedule Table */}
            <div className="p-6 print:p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Jadwal Angsuran
              </h3>

              {schedule.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Masukkan harga barang dan tenor untuk melihat jadwal angsuran.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wide border-b-2 border-gray-200">
                        <th className="pb-2 pr-2 font-medium w-10">No</th>
                        <th className="pb-2 pr-2 font-medium">Bulan</th>
                        <th className="pb-2 pr-2 font-medium text-right">
                          Angsuran Pokok
                        </th>
                        <th className="pb-2 pr-2 font-medium text-right">
                          Imbal Jasa
                        </th>
                        <th className="pb-2 pr-2 font-medium text-right">
                          Angsuran / Bulan
                        </th>
                        <th className="pb-2 font-medium text-right">
                          Sisa Pokok
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Saldo Awal */}
                      <tr className="border-b border-gray-100 bg-gray-50 print:bg-transparent font-semibold">
                        <td className="py-2 pr-2 text-gray-500">-</td>
                        <td className="py-2 pr-2 text-gray-700">Saldo Awal</td>
                        <td className="py-2 pr-2 text-right">-</td>
                        <td className="py-2 pr-2 text-right">-</td>
                        <td className="py-2 pr-2 text-right">-</td>
                        <td className="py-2 text-right text-gray-900">
                          {formatCurrency(price)}
                        </td>
                      </tr>

                      {schedule.map((row) => (
                        <tr
                          key={row.installmentNumber}
                          className="border-b border-gray-50 last:border-b-0"
                        >
                          <td className="py-2 pr-2 text-gray-500 text-center">
                            {row.installmentNumber}
                          </td>
                          <td className="py-2 pr-2 text-gray-700 whitespace-nowrap">
                            {row.dueDate.toLocaleDateString("id-ID", {
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-2 pr-2 text-right text-gray-900 font-medium tabular-nums">
                            {formatCurrency(row.principalAmount)}
                          </td>
                          <td className="py-2 pr-2 text-right text-gray-700 tabular-nums">
                            {formatCurrency(row.interestAmount)}
                          </td>
                          <td className="py-2 pr-2 text-right text-gray-900 font-semibold tabular-nums">
                            {formatCurrency(row.totalAmount)}
                          </td>
                          <td className="py-2 text-right text-gray-900 font-medium tabular-nums">
                            {formatCurrency(row.remainingBalance)}
                          </td>
                        </tr>
                      ))}

                      {/* Total row */}
                      <tr className="border-t-2 border-gray-300 font-bold">
                        <td className="pt-3 pr-2" colSpan={2}>
                          <span className="text-gray-700">TOTAL</span>
                        </td>
                        <td className="pt-3 pr-2 text-right text-gray-900 tabular-nums">
                          {formatCurrency(price)}
                        </td>
                        <td className="pt-3 pr-2 text-right text-gray-700 tabular-nums">
                          {formatCurrency(Math.round(totalInterest))}
                        </td>
                        <td className="pt-3 pr-2 text-right text-gray-900 tabular-nums">
                          {formatCurrency(Math.round(totalRepayment))}
                        </td>
                        <td className="pt-3 text-right text-green-700 tabular-nums">
                          {formatCurrency(0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer note */}
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 print:text-[10px]">
                <p>
                  * Perhitungan ini dibuat oleh Pengurus Koperasi Pegawai BKI.
                </p>
                <p>
                  * Biaya administrasi 1% dan simpanan khusus 1% dipotong dari
                  harga barang saat pencairan.
                </p>
                <p>
                  * Jadwal angsuran menggunakan metode imbal jasa flat.
                </p>
              </div>

              {/* Signature area - print only */}
              <div className="hidden print:flex justify-between mt-8 pt-4">
                <div className="text-center w-[45%]">
                  <p className="text-xs">Mengetahui,</p>
                  <p className="text-xs">Pengurus Koperasi</p>
                  <div className="h-16" />
                  <p className="text-xs border-t border-gray-400 pt-1">
                    (________________________)
                  </p>
                </div>
                <div className="text-center w-[45%]">
                  <p className="text-xs">Pemohon,</p>
                  <div className="h-16 mt-4" />
                  <p className="text-xs border-t border-gray-400 pt-1">
                    ({requester?.fullName || "________________________"})
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          nav,
          header,
          aside,
          .print\\:hidden {
            display: none !important;
          }
          body {
            background: white !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
