"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CreditCard, Plus } from "lucide-react";
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
  status: string;
  tenorMonths: number;
  monthlyInstallment: string;
  purpose: string;
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
    if (status === "approved" || status === "disbursed") {
      return "bg-green-100 text-green-700";
    }
    if (status === "rejected") {
      return "bg-red-100 text-red-700";
    }
    return "bg-amber-100 text-amber-700";
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
      {/*  Loans table                                                  */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 text-sm mb-4">
          Daftar Pinjaman
        </h2>

        {sortedLoans.length === 0 ? (
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 uppercase tracking-wide text-xs border-b border-gray-100">
                  <th className="pb-3 font-medium">Tracking</th>
                  <th className="pb-3 font-medium">Jenis</th>
                  <th className="pb-3 font-medium text-right">Jumlah</th>
                  <th className="pb-3 font-medium text-center">Tenor</th>
                  <th className="pb-3 font-medium text-right">Angsuran/bln</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                  <th className="pb-3 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {sortedLoans.map((loan) => (
                  <tr
                    key={loan.id}
                    className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 font-mono text-xs text-teal-600 font-medium">
                      {loan.trackingNumber}
                    </td>
                    <td className="py-3 text-gray-900 font-medium whitespace-nowrap">
                      {LOAN_TYPE_LABELS[loan.loanType] || loan.loanType}
                    </td>
                    <td className="py-3 text-right text-gray-900 font-semibold whitespace-nowrap">
                      {formatCurrency(loan.amount)}
                    </td>
                    <td className="py-3 text-center text-gray-700">
                      {loan.tenorMonths} bln
                    </td>
                    <td className="py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(loan.monthlyInstallment)}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${statusBadgeClass(
                          loan.status
                        )}`}
                      >
                        {LOAN_STATUS_LABELS[loan.status] || loan.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 whitespace-nowrap">
                      {new Date(loan.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
