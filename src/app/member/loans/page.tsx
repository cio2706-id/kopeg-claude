"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  CreditCard,
  Plus,
  FileDown,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Receipt,
  Calendar,
  Percent,
  Banknote,
  TrendingUp,
  Package,
  Plane,
  Car,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  formatCurrency,
  LOAN_TYPE_LABELS,
  LOAN_STATUS_LABELS,
} from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Loan {
  id: string;
  trackingNumber: string;
  loanType: string;
  amount: string;
  interestRate: string;
  status: string;
  tenorMonths: number;
  monthlyInstallment: string;
  purpose: string;
  disbursedAt: string | null;
  createdAt: string;
  queueNumber: number | null;
  queuePeriod: string | null;
  holdReason: string | null;
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();
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
      const res = await fetch("/api/loans");
      if (res.ok) {
        const data = await res.json();
        setLoans(data.loans || []);
      }
    } catch (error) {
      console.error("Failed to load loans:", error);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/member/login");
  }

  /* ---- derived data ---- */

  // Dicairkan = loans that have been disbursed
  const disbursedLoans = loans.filter(
    (l) => l.status === "disbursed" || l.status === "selesai"
  );
  // On progress = loans that are in the approval/process pipeline (not yet disbursed, not rejected/draft)
  const onProgressLoans = loans.filter(
    (l) =>
      l.status !== "rejected" &&
      l.status !== "draft" &&
      l.status !== "disbursed" &&
      l.status !== "selesai"
  );

  const totalDisbursedAmount = disbursedLoans.reduce(
    (sum, l) => sum + parseFloat(l.amount),
    0
  );
  const totalOnProgressAmount = onProgressLoans.reduce(
    (sum, l) => sum + parseFloat(l.amount),
    0
  );

  // Group by loan type for summary cards
  const loanTypeBreakdown: Record<string, { disbursedCount: number; disbursedAmount: number; onProgressCount: number; onProgressAmount: number }> = {};
  for (const loan of loans) {
    if (loan.status === "rejected" || loan.status === "draft") continue;
    if (!loanTypeBreakdown[loan.loanType]) {
      loanTypeBreakdown[loan.loanType] = { disbursedCount: 0, disbursedAmount: 0, onProgressCount: 0, onProgressAmount: 0 };
    }
    const amount = parseFloat(loan.amount);
    if (loan.status === "disbursed" || loan.status === "selesai") {
      loanTypeBreakdown[loan.loanType].disbursedCount++;
      loanTypeBreakdown[loan.loanType].disbursedAmount += amount;
    } else {
      loanTypeBreakdown[loan.loanType].onProgressCount++;
      loanTypeBreakdown[loan.loanType].onProgressAmount += amount;
    }
  }

  const sortedLoans = [...loans].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const LOAN_TYPE_ICONS: Record<string, React.ReactNode> = {
    reguler: <CreditCard className="w-4 h-4 text-teal-600" />,
    khusus: <TrendingUp className="w-4 h-4 text-indigo-600" />,
    barang: <Package className="w-4 h-4 text-amber-600" />,
    travel: <Plane className="w-4 h-4 text-red-600" />,
    kepemilikan_kendaraan: <Car className="w-4 h-4 text-sky-600" />,
    channeling: <CreditCard className="w-4 h-4 text-purple-600" />,
  };

  const LOAN_TYPE_BG: Record<string, string> = {
    reguler: "bg-teal-100",
    khusus: "bg-indigo-100",
    barang: "bg-amber-100",
    travel: "bg-red-100",
    kepemilikan_kendaraan: "bg-sky-100",
    channeling: "bg-purple-100",
  };

  /* ---- status badge helper ---- */

  function statusBadgeClass(status: string): string {
    if (status === "approved" || status === "disbursed" || status === "selesai") {
      return "bg-green-100 text-green-700";
    }
    if (status === "rejected") {
      return "bg-red-100 text-red-700";
    }
    if (status === "held") {
      return "bg-orange-100 text-orange-700";
    }
    return "bg-amber-100 text-amber-700";
  }

  function canDownloadForm(loan: Loan): boolean {
    return loan.loanType !== "channeling" && loan.loanType !== "travel";
  }

  function hasKartuPinjaman(loan: Loan): boolean {
    return ["disbursed", "selesai", "bank_process"].includes(loan.status);
  }

  /* ---- loading state ---- */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat data pinjaman...</p>
        </div>
      </div>
    );
  }

  /* ---- render ---- */

  return (
    <DashboardLayout
      variant="member"
      userName={userName}
      userEmail={userEmail}
      onLogout={handleLogout}
    >
      {/* Page heading */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pinjaman Saya</h1>
            <p className="text-sm text-gray-500">
              Kelola dan pantau pinjaman Anda
            </p>
          </div>
        </div>
        <Link
          href="/member/loan-application"
          className="inline-flex items-center gap-2 bg-teal-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-600 transition-all shadow-lg shadow-teal-200"
        >
          <Plus className="w-4 h-4" />
          Ajukan Pinjaman
        </Link>
      </div>

      {/* ============================================================ */}
      {/*  Summary cards - Disbursed vs On Progress                     */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Pinjaman Dicairkan</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {disbursedLoans.length}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Total {formatCurrency(totalDisbursedAmount)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Pinjaman Dalam Proses</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {onProgressLoans.length}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Total {formatCurrency(totalOnProgressAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Breakdown by loan type                                       */}
      {/* ============================================================ */}
      {Object.keys(loanTypeBreakdown).length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">
            Ringkasan per Jenis Pinjaman
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(loanTypeBreakdown).map(([type, data]) => (
              <div
                key={type}
                className="flex items-start gap-3 p-4 rounded-xl bg-gray-50"
              >
                <div
                  className={`w-9 h-9 rounded-lg ${LOAN_TYPE_BG[type] || "bg-gray-200"} flex items-center justify-center shrink-0`}
                >
                  {LOAN_TYPE_ICONS[type] || <CreditCard className="w-4 h-4 text-gray-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {LOAN_TYPE_LABELS[type] || type}
                  </p>
                  {data.disbursedCount > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Dicairkan: {data.disbursedCount} ({formatCurrency(data.disbursedAmount)})
                    </p>
                  )}
                  {data.onProgressCount > 0 && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Dalam Proses: {data.onProgressCount} ({formatCurrency(data.onProgressAmount)})
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Pinjaman Dicairkan (Active/Disbursed)                        */}
      {/* ============================================================ */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <h2 className="font-semibold text-gray-900 text-sm">
            Pinjaman Dicairkan
          </h2>
          <span className="text-xs text-gray-400">({disbursedLoans.length})</span>
        </div>

        {disbursedLoans.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-gray-400 text-sm text-center py-4">
              Belum ada pinjaman yang dicairkan.
            </p>
          </div>
        ) : (
          [...disbursedLoans]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((loan) => {
              const isExpanded = expandedId === loan.id;
              const adminFee = parseFloat(loan.amount) * 0.01;
              const simpananKhusus = parseFloat(loan.amount) * 0.01;
              const netAmount = parseFloat(loan.amount) - adminFee - simpananKhusus;

              return (
                <div key={loan.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 border-green-400">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : loan.id)}
                    className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-teal-600 font-medium">
                          {loan.trackingNumber}
                        </span>
                        {loan.queueNumber && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Urut #{loan.queueNumber}
                          </span>
                        )}
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${statusBadgeClass(loan.status)}`}>
                          {LOAN_STATUS_LABELS[loan.status] || loan.status}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {LOAN_TYPE_LABELS[loan.loanType] || loan.loanType}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(loan.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                        {loan.queuePeriod && (
                          <span className="ml-2 text-gray-400">&middot; Periode {loan.queuePeriod}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900">{formatCurrency(loan.amount)}</p>
                      <p className="text-xs text-gray-500">
                        {loan.tenorMonths} bln &middot; {formatCurrency(loan.monthlyInstallment)}/bln
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-5 border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-start gap-2">
                          <Banknote className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] text-gray-400">Pagu Pinjaman</p>
                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(loan.amount)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Percent className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] text-gray-400">Imbal Jasa</p>
                            <p className="text-sm font-semibold text-gray-900">{loan.interestRate}% / tahun</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] text-gray-400">Tenor</p>
                            <p className="text-sm font-semibold text-gray-900">{loan.tenorMonths} bulan</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Receipt className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] text-gray-400">Angsuran / Bulan</p>
                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(loan.monthlyInstallment)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Banknote className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] text-gray-400">Total Pengembalian</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatCurrency(parseFloat(loan.monthlyInstallment) * loan.tenorMonths)}
                            </p>
                          </div>
                        </div>
                        {loan.disbursedAt && (
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[11px] text-gray-400">Tanggal Cair</p>
                              <p className="text-sm font-semibold text-green-700">
                                {new Date(loan.disbursedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Biaya-biaya</h4>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Biaya Administrasi (1%)</span>
                            <span className="font-medium text-gray-900">{formatCurrency(adminFee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Simpanan Khusus (1%)</span>
                            <span className="font-medium text-gray-900">{formatCurrency(simpananKhusus)}</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-200 pt-1.5">
                            <span className="text-gray-900 font-medium">Dana Diterima</span>
                            <span className="font-bold text-teal-700">{formatCurrency(netAmount)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hasKartuPinjaman(loan) && (
                          <Link
                            href={`/member/loans/${loan.id}/kartu`}
                            className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 px-4 py-2 rounded-lg text-xs font-medium hover:bg-teal-100 transition border border-teal-200"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            Kartu Pinjaman
                          </Link>
                        )}
                        {canDownloadForm(loan) && (
                          <Link
                            href={`/member/loans/${loan.id}/print`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-100 transition border border-blue-200"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            Download Formulir
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>

      {/* ============================================================ */}
      {/*  Pinjaman Dalam Proses (On Progress)                          */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <h2 className="font-semibold text-gray-900 text-sm">
            Pinjaman Dalam Proses
          </h2>
          <span className="text-xs text-gray-400">({onProgressLoans.length})</span>
        </div>

        {onProgressLoans.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-gray-400 text-sm text-center py-4">
              Tidak ada pinjaman dalam proses.
            </p>
          </div>
        ) : (
          [...onProgressLoans]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((loan) => {
              const isExpanded = expandedId === loan.id;
              const adminFee = parseFloat(loan.amount) * 0.01;
              const simpananKhusus = parseFloat(loan.amount) * 0.01;
              const netAmount = parseFloat(loan.amount) - adminFee - simpananKhusus;

              return (
                <div key={loan.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 border-amber-400">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : loan.id)}
                    className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-teal-600 font-medium">
                          {loan.trackingNumber}
                        </span>
                        {loan.queueNumber && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Urut #{loan.queueNumber}
                          </span>
                        )}
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${statusBadgeClass(loan.status)}`}>
                          {LOAN_STATUS_LABELS[loan.status] || loan.status}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {LOAN_TYPE_LABELS[loan.loanType] || loan.loanType}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(loan.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                        {loan.queuePeriod && (
                          <span className="ml-2 text-gray-400">&middot; Periode {loan.queuePeriod}</span>
                        )}
                      </p>
                      {loan.status === "held" && loan.holdReason && (
                        <p className="text-xs text-orange-600 mt-1">
                          Ditunda: {loan.holdReason}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900">{formatCurrency(loan.amount)}</p>
                      <p className="text-xs text-gray-500">
                        {loan.tenorMonths} bln &middot; {formatCurrency(loan.monthlyInstallment)}/bln
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-5 border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-start gap-2">
                          <Banknote className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] text-gray-400">Pagu Pinjaman</p>
                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(loan.amount)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Percent className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] text-gray-400">Imbal Jasa</p>
                            <p className="text-sm font-semibold text-gray-900">{loan.interestRate}% / tahun</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] text-gray-400">Tenor</p>
                            <p className="text-sm font-semibold text-gray-900">{loan.tenorMonths} bulan</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Receipt className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] text-gray-400">Angsuran / Bulan</p>
                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(loan.monthlyInstallment)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Banknote className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] text-gray-400">Total Pengembalian</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatCurrency(parseFloat(loan.monthlyInstallment) * loan.tenorMonths)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Biaya-biaya</h4>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Biaya Administrasi (1%)</span>
                            <span className="font-medium text-gray-900">{formatCurrency(adminFee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Simpanan Khusus (1%)</span>
                            <span className="font-medium text-gray-900">{formatCurrency(simpananKhusus)}</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-200 pt-1.5">
                            <span className="text-gray-900 font-medium">Dana Diterima</span>
                            <span className="font-bold text-teal-700">{formatCurrency(netAmount)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {canDownloadForm(loan) && (
                          <Link
                            href={`/member/loans/${loan.id}/print`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-100 transition border border-blue-200"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            Download Formulir
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
    </DashboardLayout>
  );
}
