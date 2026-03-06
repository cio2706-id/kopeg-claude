"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Download,
  Printer,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LoanBalanceInfo {
  id: string;
  loanType: string;
  period: string;
  saldo: string;
  monthlyInstallment: string;
  interestRate: string;
  estimatedTenor: number;
}

interface Owner {
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

const LOAN_TYPE_LABELS: Record<string, string> = {
  reguler: "Pinjaman Reguler",
  khusus: "Pinjaman Khusus",
  barang: "Pinjaman Barang",
  travel: "Pinjaman Travel",
  kepemilikan_kendaraan: "Pinjaman Kendaraan",
  channeling_mandiri: "Channeling Mandiri",
  channeling_bsi: "Channeling BSI",
  channeling: "Channeling",
};

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function ExistingKartuPinjamanPage() {
  const [loanBalance, setLoanBalance] = useState<LoanBalanceInfo | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [installmentSource, setInstallmentSource] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const params = useParams();
  const balanceId = params.id as string;
  const supabase = createSupabaseBrowserClient();

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/member/login");
      return;
    }
    setUserName(
      user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
    );
    setUserEmail(user.email || "");

    try {
      const res = await fetch(`/api/loan-balances/${balanceId}`);
      if (!res.ok) {
        router.push("/member/loans");
        return;
      }
      const data = await res.json();
      setLoanBalance(data.loanBalance);
      setOwner(data.owner);
      setInstallments(data.installments || []);
      setInstallmentSource(data.installmentSource || "");
    } catch (error) {
      console.error("Failed to load loan balance:", error);
    } finally {
      setLoading(false);
    }
  }, [router, supabase, balanceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/member/login");
  }

  function handlePrint() {
    window.print();
  }

  /* ---- loading state ---- */

  if (loading || !loanBalance) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat kartu pinjaman...</p>
        </div>
      </div>
    );
  }

  const saldo = parseFloat(loanBalance.saldo || "0");
  const monthlyInstallment = parseFloat(loanBalance.monthlyInstallment || "0");
  const interestRate = parseFloat(loanBalance.interestRate || "0");
  const totalInterest = installments.reduce((s, r) => s + parseFloat(r.interestAmount), 0);
  const totalRepayment = installments.reduce((s, r) => s + parseFloat(r.totalAmount), 0);
  const totalPrincipal = installments.reduce((s, r) => s + parseFloat(r.principalAmount), 0);
  const typeLabel = LOAN_TYPE_LABELS[loanBalance.loanType] || loanBalance.loanType;

  const sourceLabel = installmentSource === "potongan"
    ? "Data Potongan Bulanan"
    : installmentSource === "excel_angsuran"
    ? "Data Kertas Kerja"
    : "Estimasi Sistem";

  /* ---- render ---- */

  return (
    <DashboardLayout
      variant="member"
      userName={userName}
      userEmail={userEmail}
      onLogout={handleLogout}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/member/loans"
            className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Kartu Pinjaman</h1>
            <p className="text-sm text-gray-500">{typeLabel} - Existing</p>
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
        {/* Card Header */}
        <div className="border-b border-gray-200 p-6 print:p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center print:hidden">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 print:text-base">
                KARTU PINJAMAN - {typeLabel.toUpperCase()}
              </h2>
              <p className="text-sm text-gray-500 print:text-xs">
                KOPERASI PEGAWAI BIRO KLASIFIKASI INDONESIA
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Nama Peminjam</p>
              <p className="font-semibold text-gray-900">{owner?.fullName || "-"}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">NIP</p>
              <p className="font-semibold text-gray-900">{owner?.employeeId || "-"}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Unit Kerja</p>
              <p className="font-semibold text-gray-900">{owner?.department || "-"}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Saldo Pinjaman</p>
              <p className="font-bold text-gray-900">{formatCurrency(saldo)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Imbal Jasa</p>
              <p className="font-semibold text-gray-900">{interestRate}% / tahun</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Angsuran / Bulan</p>
              <p className="font-semibold text-gray-900">{formatCurrency(monthlyInstallment)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Sisa Tenor</p>
              <p className="font-semibold text-gray-900">{loanBalance.estimatedTenor} bulan</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Periode Data</p>
              <p className="font-semibold text-gray-900">{loanBalance.period}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Sumber Data</p>
              <p className="font-mono font-semibold text-blue-700 text-xs">{sourceLabel}</p>
            </div>
          </div>
        </div>

        {/* Installment Schedule Table */}
        <div className="p-6 print:p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Proyeksi Jadwal Angsuran
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
                  <td className="py-2 text-right text-gray-900">{formatCurrency(saldo)}</td>
                </tr>

                {installments.map((inst) => (
                  <tr
                    key={inst.id}
                    className="border-b border-gray-50 last:border-b-0"
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
                    {formatCurrency(totalPrincipal)}
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
            <p>* Kartu pinjaman ini dibuat berdasarkan data kertas kerja / saldo pinjaman existing.</p>
            <p>* Sumber angsuran: {sourceLabel}.</p>
            <p>* Jadwal angsuran bersifat proyeksi dan dapat berubah sesuai pembayaran aktual.</p>
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
