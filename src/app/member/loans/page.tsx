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

  const activeLoans = loans.filter(
    (l) =>
      l.status !== "rejected" &&
      l.status !== "draft"
  );
  const totalActiveAmount = activeLoans.reduce(
    (sum, l) => sum + parseFloat(l.amount),
    0
  );

  const sortedLoans = [...loans].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  /* ---- status badge helper ---- */

  function statusBadgeClass(status: string): string {
    if (status === "approved" || status === "disbursed" || status === "selesai") {
      return "bg-green-100 text-green-700";
    }
    if (status === "rejected") {
      return "bg-red-100 text-red-700";
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
      {/*  Summary cards                                                */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-teal-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Pinjaman Aktif</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {activeLoans.length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Total Jumlah Aktif</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">
              {formatCurrency(totalActiveAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Loans list                                                   */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900 text-sm">
          Daftar Pinjaman
        </h2>

        {sortedLoans.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="py-12 text-center">
              <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-4">
                Belum ada pinjaman.
              </p>
              <Link
                href="/member/loan-application"
                className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Ajukan Pinjaman Baru
              </Link>
            </div>
          </div>
        ) : (
          sortedLoans.map((loan) => {
            const isExpanded = expandedId === loan.id;
            const adminFee = parseFloat(loan.amount) * 0.01;
            const simpananKhusus = parseFloat(loan.amount) * 0.01;
            const netAmount = parseFloat(loan.amount) - adminFee - simpananKhusus;

            return (
              <div
                key={loan.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                {/* ── Card header (always visible) ── */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : loan.id)}
                  className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-teal-600 font-medium">
                        {loan.trackingNumber}
                      </span>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${statusBadgeClass(loan.status)}`}
                      >
                        {LOAN_STATUS_LABELS[loan.status] || loan.status}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {LOAN_TYPE_LABELS[loan.loanType] || loan.loanType}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(loan.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(loan.amount)}
                    </p>
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

                {/* ── Expanded detail ── */}
                {isExpanded && (
                  <div className="px-6 pb-5 border-t border-gray-100 pt-4">
                    {/* Detail grid */}
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
                          <p className="text-[11px] text-gray-400">Suku Bunga</p>
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
                              {new Date(loan.disbursedAt).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Biaya-biaya */}
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

                    {/* Action buttons */}
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
    </DashboardLayout>
  );
}
