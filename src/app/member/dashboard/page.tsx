"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Building2,
  Wallet,
  CreditCard,
  FileText,
  LogOut,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, LOAN_TYPE_LABELS, LOAN_STATUS_LABELS } from "@/lib/utils";

interface Saving {
  id: string;
  period: string;
  simpananPokok: string;
  simpananWajib: string;
  simpananSukarela: string;
  totalBalance: string;
}

interface Loan {
  id: string;
  loanType: string;
  amount: string;
  status: string;
  tenorMonths: number;
  monthlyInstallment: string;
  createdAt: string;
}

export default function MemberDashboardPage() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/member/login");
        return;
      }
      setUserName(user.email || "");

      try {
        const [savingsRes, loansRes] = await Promise.all([
          fetch("/api/savings"),
          fetch("/api/loans"),
        ]);

        if (savingsRes.ok) {
          const data = await savingsRes.json();
          setSavings(data.savings || []);
        }
        if (loansRes.ok) {
          const data = await loansRes.json();
          setLoans(data.loans || []);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/member/login");
  }

  const latestSaving = savings[0];
  const totalSavings = latestSaving ? parseFloat(latestSaving.totalBalance) : 0;
  const activeLoans = loans.filter((l) => !["rejected", "draft"].includes(l.status));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            <div>
              <p className="font-bold text-sm">Dashboard Anggota</p>
              <p className="text-xs text-blue-200">{userName}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1 text-sm hover:bg-blue-700 px-3 py-1.5 rounded transition">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Simpanan</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalSavings)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pinjaman Aktif</p>
                <p className="text-lg font-bold text-gray-900">{activeLoans.length}</p>
              </div>
            </div>
          </div>
          <Link href="/member/loan-application" className="bg-white rounded-lg shadow p-5 hover:ring-2 hover:ring-blue-500 transition group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ajukan Pinjaman</p>
                  <p className="text-sm font-semibold text-gray-900">Klik untuk mengajukan</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" />
            </div>
          </Link>
        </div>

        {/* Savings Section */}
        <section className="bg-white rounded-lg shadow">
          <div className="p-5 border-b flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-gray-900">Rincian Simpanan</h2>
          </div>
          <div className="p-5">
            {savings.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada data simpanan.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Periode</th>
                      <th className="pb-2 font-medium text-right">Pokok</th>
                      <th className="pb-2 font-medium text-right">Wajib</th>
                      <th className="pb-2 font-medium text-right">Sukarela</th>
                      <th className="pb-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savings.slice(0, 12).map((s) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-2 text-gray-900">{s.period}</td>
                        <td className="py-2 text-right">{formatCurrency(s.simpananPokok)}</td>
                        <td className="py-2 text-right">{formatCurrency(s.simpananWajib)}</td>
                        <td className="py-2 text-right">{formatCurrency(s.simpananSukarela)}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(s.totalBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Loans Section */}
        <section className="bg-white rounded-lg shadow">
          <div className="p-5 border-b flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Pinjaman Saya</h2>
          </div>
          <div className="p-5">
            {loans.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada pinjaman.</p>
            ) : (
              <div className="space-y-3">
                {loans.map((loan) => (
                  <div key={loan.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{LOAN_TYPE_LABELS[loan.loanType] || loan.loanType}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        loan.status === "approved" || loan.status === "disbursed"
                          ? "bg-green-100 text-green-700"
                          : loan.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {LOAN_STATUS_LABELS[loan.status] || loan.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                      <div>
                        <p className="text-xs text-gray-400">Jumlah</p>
                        <p className="font-medium">{formatCurrency(loan.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Tenor</p>
                        <p className="font-medium">{loan.tenorMonths} bulan</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Angsuran/bln</p>
                        <p className="font-medium">{formatCurrency(loan.monthlyInstallment)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
