"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency, LOAN_TYPE_LABELS, LOAN_STATUS_LABELS } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
  trackingNumber: string;
  tenorMonths: number;
  monthlyInstallment: string;
  createdAt: string;
}

const PIE_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444"];

export default function MemberDashboardPage() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [savingsTab, setSavingsTab] = useState<"all" | "pokok" | "wajib" | "sukarela">("all");
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/member/login");
      return;
    }
    setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "User");

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
  }, [router, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/member/login");
  }

  const latestSaving = savings[0];
  const totalSavings = latestSaving ? parseFloat(latestSaving.totalBalance) : 0;
  const totalPokok = latestSaving ? parseFloat(latestSaving.simpananPokok) : 0;
  const totalWajib = latestSaving ? parseFloat(latestSaving.simpananWajib) : 0;
  const totalSukarela = latestSaving ? parseFloat(latestSaving.simpananSukarela) : 0;
  const activeLoans = loans.filter((l) => !["rejected", "draft"].includes(l.status));
  const totalLoanAmount = activeLoans.reduce((sum, l) => sum + parseFloat(l.amount), 0);
  const totalMonthlyInstallment = activeLoans.reduce((sum, l) => sum + parseFloat(l.monthlyInstallment), 0);

  // Chart data
  const barChartData = savings.slice(0, 6).reverse().map((s) => ({
    period: s.period,
    Pokok: parseFloat(s.simpananPokok),
    Wajib: parseFloat(s.simpananWajib),
    Sukarela: parseFloat(s.simpananSukarela),
  }));

  const pieData = [
    { name: "Pokok", value: totalPokok },
    { name: "Wajib", value: totalWajib },
    { name: "Sukarela", value: totalSukarela },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DashboardLayout variant="member" userName={userName} onLogout={handleLogout}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">Total Simpanan</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSavings)}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Simpanan Wajib</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalWajib)}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-pink-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-pink-600" />
            </div>
            <p className="text-sm text-gray-500">Total Pinjaman</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalLoanAmount)}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm text-gray-500">Angsuran / Bulan</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMonthlyInstallment)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Last Loans */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Pinjaman Terakhir</h2>
            <Link href="/member/loan-application" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Ajukan Baru
            </Link>
          </div>
          <div className="p-5">
            {loans.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Belum ada pinjaman.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                      <th className="pb-3 font-medium">Jenis</th>
                      <th className="pb-3 font-medium">Tracking</th>
                      <th className="pb-3 font-medium">Tenor</th>
                      <th className="pb-3 font-medium text-right">Jumlah</th>
                      <th className="pb-3 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.slice(0, 5).map((loan) => (
                      <tr key={loan.id} className="border-t border-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              loan.status === "disbursed" ? "bg-green-100" :
                              loan.status === "rejected" ? "bg-red-100" : "bg-blue-100"
                            }`}>
                              {loan.status === "disbursed" ? (
                                <ArrowDownRight className="w-4 h-4 text-green-600" />
                              ) : loan.status === "rejected" ? (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{LOAN_TYPE_LABELS[loan.loanType]}</p>
                              <p className="text-xs text-gray-400">{new Date(loan.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-xs text-gray-500">{loan.trackingNumber}</td>
                        <td className="py-3 text-gray-600">{loan.tenorMonths} bln</td>
                        <td className="py-3 text-right font-semibold text-gray-900">{formatCurrency(loan.amount)}</td>
                        <td className="py-3 text-center">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            loan.status === "approved" || loan.status === "disbursed"
                              ? "bg-green-100 text-green-700"
                              : loan.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {LOAN_STATUS_LABELS[loan.status] || loan.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Member Card */}
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 text-white p-6 shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
            <div className="relative">
              <p className="text-xs text-teal-100">Saldo Simpanan</p>
              <p className="text-2xl font-bold mt-1 mb-4">{formatCurrency(totalSavings)}</p>
              <div className="flex justify-between text-xs mt-4">
                <div>
                  <p className="text-teal-200">ANGGOTA</p>
                  <p className="font-semibold mt-0.5">{userName}</p>
                </div>
                <div className="text-right">
                  <p className="text-teal-200">STATUS</p>
                  <p className="font-semibold mt-0.5">Aktif</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20">
                <p className="text-sm font-mono tracking-wider">Koperasi Pegawai BKI</p>
              </div>
            </div>
          </div>

          <Link
            href="/member/loan-application"
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Ajukan Pinjaman</p>
              <p className="text-xs text-gray-400">Reguler, Darurat, Pendidikan, Perumahan</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Savings Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Aktivitas Simpanan</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Pokok</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Wajib</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Sukarela</span>
            </div>
          </div>
          <div className="p-5">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barChartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 12, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="Pokok" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Wajib" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Sukarela" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
                Belum ada data simpanan
              </div>
            )}
          </div>
        </div>

        {/* Savings Breakdown Pie Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Komposisi Simpanan</h2>
          </div>
          <div className="p-5">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {[
                    { label: "Pokok", value: totalPokok, color: "#4F46E5" },
                    { label: "Wajib", value: totalWajib, color: "#10B981" },
                    { label: "Sukarela", value: totalSukarela, color: "#F59E0B" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-600">{item.label}</span>
                      </div>
                      <span className="font-medium text-gray-900">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
                Belum ada data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Savings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-semibold text-gray-900">Rincian Simpanan</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(["all", "pokok", "wajib", "sukarela"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSavingsTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  savingsTab === tab
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "all" ? "Semua" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5">
          {savings.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Belum ada data simpanan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                    <th className="pb-3 font-medium">Periode</th>
                    {(savingsTab === "all" || savingsTab === "pokok") && <th className="pb-3 font-medium text-right">Pokok</th>}
                    {(savingsTab === "all" || savingsTab === "wajib") && <th className="pb-3 font-medium text-right">Wajib</th>}
                    {(savingsTab === "all" || savingsTab === "sukarela") && <th className="pb-3 font-medium text-right">Sukarela</th>}
                    <th className="pb-3 font-medium text-right">Total</th>
                    <th className="pb-3 font-medium text-center">Bukti</th>
                  </tr>
                </thead>
                <tbody>
                  {savings.slice(0, 12).map((s) => (
                    <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 text-gray-900 font-medium">{s.period}</td>
                      {(savingsTab === "all" || savingsTab === "pokok") && <td className="py-3 text-right text-gray-600">{formatCurrency(s.simpananPokok)}</td>}
                      {(savingsTab === "all" || savingsTab === "wajib") && <td className="py-3 text-right text-gray-600">{formatCurrency(s.simpananWajib)}</td>}
                      {(savingsTab === "all" || savingsTab === "sukarela") && <td className="py-3 text-right text-gray-600">{formatCurrency(s.simpananSukarela)}</td>}
                      <td className="py-3 text-right font-semibold text-gray-900">{formatCurrency(s.totalBalance)}</td>
                      <td className="py-3 text-center">
                        <button className="text-xs text-blue-600 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 transition">
                          <Download className="w-3 h-3 inline mr-1" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
