"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Download,
  Printer,
  CreditCard,
  Package,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  formatCurrency,
  LOAN_TYPE_LABELS,
  generateInstallmentSchedule,
} from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

interface Installment {
  id: string;
  installmentNumber: number;
  dueDate: string | null;
  principalAmount: string;
  interestAmount: string;
  totalAmount: string;
  remainingBalance: string;
  description: string | null;
  paidAt: string | null;
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function PengurusKartuPinjamanPage() {
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [requester, setRequester] = useState<Requester | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

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

      if (data.installments && data.installments.length > 0) {
        setInstallments(data.installments);
      } else if (data.loan) {
        const schedule = generateInstallmentSchedule(
          parseFloat(data.loan.amount),
          parseFloat(data.loan.interestRate),
          data.loan.tenorMonths,
          data.loan.disbursedAt ? new Date(data.loan.disbursedAt) : new Date(data.loan.createdAt)
        );
        setInstallments(
          schedule.map((row, idx) => ({
            id: `gen-${idx}`,
            installmentNumber: row.installmentNumber,
            dueDate: row.dueDate.toISOString(),
            principalAmount: row.principalAmount.toString(),
            interestAmount: row.interestAmount.toString(),
            totalAmount: row.totalAmount.toString(),
            remainingBalance: row.remainingBalance.toString(),
            description: row.description,
            paidAt: null,
          }))
        );
      }
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

  function handlePrint() {
    window.print();
  }

  if (loading || !loan) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat kartu pinjaman...</p>
        </div>
      </div>
    );
  }

  const isBarang = loan.loanType === "barang";
  const loanAmount = parseFloat(loan.amount);
  const adminFee = Math.round(loanAmount * 0.01);
  const simpananKhusus = Math.round(loanAmount * 0.01);
  const netDisbursement = loanAmount - adminFee - simpananKhusus;
  const totalInterest = installments.reduce((s, r) => s + parseFloat(r.interestAmount), 0);
  const totalRepayment = installments.reduce((s, r) => s + parseFloat(r.totalAmount), 0);

  const fd = loan.formData || {};
  const headerIcon = isBarang
    ? <Package className="w-5 h-5 text-purple-600" />
    : <CreditCard className="w-5 h-5 text-teal-600" />;
  const headerIconBg = isBarang ? "bg-purple-100" : "bg-teal-100";

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
            <h1 className="text-xl font-bold text-gray-900">Kartu Pinjaman</h1>
            <p className="text-sm text-gray-500">{loan.trackingNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isBarang && (
            <Link
              href={`/pengurus/loans/${loanId}/perhitungan-barang`}
              className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-100 transition border border-purple-200"
            >
              <Package className="w-4 h-4" />
              Perhitungan
            </Link>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-600 transition shadow-lg shadow-teal-200"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {/* Printable Kartu Pinjaman */}
      <div ref={printRef} className="bg-white rounded-2xl shadow-sm print:shadow-none print:rounded-none">
        {/* Print Header */}
        <div className="text-center mb-4 hidden print:block p-4 pb-0">
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

        {/* Card Header */}
        <div className="border-b border-gray-200 p-6 print:p-4 print:pt-0">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl ${headerIconBg} flex items-center justify-center print:hidden`}>
              {headerIcon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 print:text-base">
                KARTU PINJAMAN - {(LOAN_TYPE_LABELS[loan.loanType] || loan.loanType).toUpperCase()}
              </h2>
              <p className="text-sm text-gray-500 print:text-xs">
                KOPERASI PEGAWAI BIRO KLASIFIKASI INDONESIA
              </p>
            </div>
          </div>

          {/* Loan Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Nama Peminjam</p>
              <p className="font-semibold text-gray-900">{requester?.fullName || "-"}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">NIP</p>
              <p className="font-semibold text-gray-900">{requester?.employeeId || "-"}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Unit Kerja</p>
              <p className="font-semibold text-gray-900">{requester?.department || "-"}</p>
            </div>
            {isBarang && (
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">Jenis Barang</p>
                <p className="font-semibold text-gray-900">
                  {String(fd.jenisKebutuhan || "-")} - {String(fd.merek || "")} {String(fd.tipe || "")}
                </p>
              </div>
            )}
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                {isBarang ? "Harga Barang" : "Pagu Pinjaman"}
              </p>
              <p className="font-bold text-gray-900">{formatCurrency(loanAmount)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Imbal Jasa</p>
              <p className="font-semibold text-gray-900">{loan.interestRate}% / tahun</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Jangka Waktu</p>
              <p className="font-semibold text-gray-900">{loan.tenorMonths} bulan</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Tanggal Pencairan</p>
              <p className="font-semibold text-gray-900">
                {loan.disbursedAt
                  ? new Date(loan.disbursedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">No. Tracking</p>
              <p className="font-mono font-semibold text-teal-700">{loan.trackingNumber}</p>
            </div>
          </div>
        </div>

        {/* Biaya-biaya Summary */}
        <div className="border-b border-gray-200 p-6 print:p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Biaya-biaya</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 print:bg-transparent print:border print:border-gray-200">
              <p className="text-[11px] text-gray-400">Biaya Administrasi (1%)</p>
              <p className="font-semibold text-gray-900">{formatCurrency(adminFee)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 print:bg-transparent print:border print:border-gray-200">
              <p className="text-[11px] text-gray-400">Simpanan Khusus (1%)</p>
              <p className="font-semibold text-gray-900">{formatCurrency(simpananKhusus)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 print:bg-transparent print:border print:border-gray-200">
              <p className="text-[11px] text-gray-400">Total Potongan</p>
              <p className="font-semibold text-red-600">{formatCurrency(adminFee + simpananKhusus)}</p>
            </div>
            <div className="bg-teal-50 rounded-lg p-3 print:bg-transparent print:border print:border-teal-300">
              <p className="text-[11px] text-gray-400">Dana Diterima</p>
              <p className="font-bold text-teal-700">{formatCurrency(netDisbursement)}</p>
            </div>
          </div>
        </div>

        {/* Installment Schedule Table */}
        <div className="p-6 print:p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Jadwal Angsuran
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wide border-b-2 border-gray-200">
                  <th className="pb-2 pr-2 font-medium w-10">No</th>
                  <th className="pb-2 pr-2 font-medium">Bulan</th>
                  <th className="pb-2 pr-2 font-medium text-right">Angsuran Pokok</th>
                  <th className="pb-2 pr-2 font-medium text-right">Imbal Jasa</th>
                  <th className="pb-2 pr-2 font-medium text-right">Angsuran / Bulan</th>
                  <th className="pb-2 font-medium text-right">Sisa Pokok</th>
                </tr>
              </thead>
              <tbody>
                {/* Initial balance row */}
                <tr className="border-b border-gray-100 bg-gray-50 print:bg-transparent font-semibold">
                  <td className="py-2 pr-2 text-gray-500">-</td>
                  <td className="py-2 pr-2 text-gray-700">Saldo Awal</td>
                  <td className="py-2 pr-2 text-right">-</td>
                  <td className="py-2 pr-2 text-right">-</td>
                  <td className="py-2 pr-2 text-right">-</td>
                  <td className="py-2 text-right text-gray-900">{formatCurrency(loanAmount)}</td>
                </tr>

                {installments.map((inst) => (
                  <tr
                    key={inst.id}
                    className={`border-b border-gray-50 last:border-b-0 ${
                      inst.paidAt ? "bg-green-50/50" : ""
                    }`}
                  >
                    <td className="py-2 pr-2 text-gray-500 text-center">{inst.installmentNumber}</td>
                    <td className="py-2 pr-2 text-gray-700 whitespace-nowrap">
                      {inst.dueDate
                        ? new Date(inst.dueDate).toLocaleDateString("id-ID", {
                            month: "short",
                            year: "numeric",
                          })
                        : `Bulan ${inst.installmentNumber}`}
                    </td>
                    <td className="py-2 pr-2 text-right text-gray-900 font-medium tabular-nums">
                      {formatCurrency(inst.principalAmount)}
                    </td>
                    <td className="py-2 pr-2 text-right text-gray-700 tabular-nums">
                      {formatCurrency(inst.interestAmount)}
                    </td>
                    <td className="py-2 pr-2 text-right text-gray-900 font-semibold tabular-nums">
                      {formatCurrency(inst.totalAmount)}
                    </td>
                    <td className="py-2 text-right text-gray-900 font-medium tabular-nums">
                      {formatCurrency(inst.remainingBalance)}
                    </td>
                  </tr>
                ))}

                {/* Total row */}
                <tr className="border-t-2 border-gray-300 font-bold">
                  <td className="pt-3 pr-2" colSpan={2}>
                    <span className="text-gray-700">TOTAL</span>
                  </td>
                  <td className="pt-3 pr-2 text-right text-gray-900 tabular-nums">
                    {formatCurrency(loanAmount)}
                  </td>
                  <td className="pt-3 pr-2 text-right text-gray-700 tabular-nums">
                    {formatCurrency(totalInterest)}
                  </td>
                  <td className="pt-3 pr-2 text-right text-gray-900 tabular-nums">
                    {formatCurrency(totalRepayment)}
                  </td>
                  <td className="pt-3 text-right text-green-700 tabular-nums">
                    {formatCurrency(0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 print:text-[10px]">
            <p>* Kartu pinjaman ini dibuat secara otomatis oleh sistem Koperasi Pegawai BKI.</p>
            <p>* Biaya administrasi 1% dan simpanan khusus 1% dipotong dari pagu pinjaman saat pencairan.</p>
            <p>* Jadwal angsuran menggunakan metode imbal jasa flat.</p>
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
              <p className="text-xs">Peminjam,</p>
              <div className="h-16 mt-4" />
              <p className="text-xs border-t border-gray-400 pt-1">
                ({requester?.fullName || "________________________"})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          nav, header, aside, .print\\:hidden { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; margin: 0 !important; }
        }
      `}</style>
    </DashboardLayout>
  );
}
