"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import {
  formatCurrency,
  LOAN_TYPE_LABELS,
  LOAN_STATUS_LABELS,
} from "@/lib/utils";
import { CreditCard, Wallet, TrendingUp, FileText } from "lucide-react";

interface Loan {
  id: string;
  trackingNumber: string;
  loanType: string;
  amount: string;
  status: string;
  tenorMonths: number;
  monthlyInstallment: string;
  purpose?: string;
  createdAt: string;
}

type LoanFilter = "all" | "reguler" | "khusus" | "barang" | "travel";

export default function PengurusLoansPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filter, setFilter] = useState<LoanFilter>("all");
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const loadData = useCallback(async () => {
    try {
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

      const res = await fetch("/api/loans?view=all");
      if (res.ok) {
        const data = await res.json();
        setLoans(data.loans || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/pengurus/login");
  }

  function getStatusBadgeClasses(status: string): string {
    if (["approved", "disbursed"].includes(status))
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (["rejected"].includes(status))
      return "bg-red-50 text-red-700 border border-red-200";
    if (["draft"].includes(status))
      return "bg-gray-100 text-gray-600 border border-gray-200";
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  const filteredLoans =
    filter === "all" ? loans : loans.filter((l) => l.loanType === filter);

  const totalLoans = loans.length;
  const activeLoans = loans.filter(
    (l) => !["rejected", "draft"].includes(l.status)
  ).length;
  const totalAmount = loans.reduce(
    (sum, l) => sum + parseFloat(l.amount || "0"),
    0
  );

  const filterOptions: { key: LoanFilter; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "reguler", label: "Reguler" },
    { key: "khusus", label: "Khusus" },
    { key: "barang", label: "Barang" },
    { key: "travel", label: "Travel" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Pinjaman</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Kelola semua data pinjaman anggota koperasi
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Total Pinjaman
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalLoans}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Pinjaman Aktif
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeLoans}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Total Nilai Pinjaman
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalAmount)}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm mb-6 w-fit">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              filter === opt.key
                ? "bg-teal-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-5">
          {filteredLoans.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                {filter !== "all"
                  ? "Tidak ada pinjaman untuk jenis ini."
                  : "Belum ada data pinjaman."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                    <th className="pb-3 font-medium">Tracking</th>
                    <th className="pb-3 font-medium">Jenis</th>
                    <th className="pb-3 font-medium text-right">Jumlah</th>
                    <th className="pb-3 font-medium text-center">Tenor</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((loan) => (
                    <tr
                      key={loan.id}
                      className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3.5">
                        <span className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded-md">
                          {loan.trackingNumber}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="text-sm font-medium text-gray-900">
                          {LOAN_TYPE_LABELS[loan.loanType] || loan.loanType}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-semibold text-gray-900">
                        {formatCurrency(loan.amount)}
                      </td>
                      <td className="py-3.5 text-center text-gray-500">
                        {loan.tenorMonths} bulan
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-medium ${getStatusBadgeClasses(loan.status)}`}
                        >
                          {LOAN_STATUS_LABELS[loan.status] || loan.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-500 text-xs">
                        {new Date(loan.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLoans.length > 0 && (
                <div className="pt-4 border-t border-gray-100 mt-2">
                  <p className="text-xs text-gray-400">
                    Menampilkan {filteredLoans.length} dari {loans.length} pinjaman.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
