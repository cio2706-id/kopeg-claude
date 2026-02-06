"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  FileText,
  Calculator,
  Send,
  CheckCircle,
  CreditCard,
  GraduationCap,
  Home,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency, calculateMonthlyInstallment, LOAN_TYPE_LABELS } from "@/lib/utils";

const INTEREST_RATES: Record<string, number> = {
  regular: 12,
  emergency: 6,
  education: 10,
  housing: 8,
};

const LOAN_TYPE_ICONS: Record<string, React.ReactNode> = {
  regular: <CreditCard className="w-6 h-6" />,
  emergency: <AlertTriangle className="w-6 h-6" />,
  education: <GraduationCap className="w-6 h-6" />,
  housing: <Home className="w-6 h-6" />,
};

const LOAN_TYPE_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  regular: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-600" },
  emergency: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-600" },
  education: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", icon: "text-purple-600" },
  housing: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "text-green-600" },
};

export default function LoanApplicationPage() {
  const [loanType, setLoanType] = useState("");
  const [amount, setAmount] = useState("");
  const [tenor, setTenor] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const checkAuth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/member/login");
      return;
    }
    setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "User");
    setAuthLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/member/login");
  }

  const interestRate = loanType ? INTEREST_RATES[loanType] || 12 : 0;
  const monthlyInstallment =
    amount && tenor && loanType
      ? calculateMonthlyInstallment(parseFloat(amount), interestRate, parseInt(tenor))
      : 0;
  const totalRepayment = monthlyInstallment * (parseInt(tenor) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanType,
          amount: parseFloat(amount),
          tenorMonths: parseInt(tenor),
          purpose,
          interestRate,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengajukan pinjaman");
      }

      const data = await res.json();
      setTrackingNumber(data.trackingNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (trackingNumber) {
    return (
      <DashboardLayout variant="member" userName={userName} onLogout={handleLogout}>
        <div className="max-w-lg mx-auto py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pengajuan Berhasil!</h2>
            <p className="text-sm text-gray-500 mb-6">Pengajuan pinjaman Anda telah diterima dan sedang diproses.</p>

            <div className="bg-[#f4f7fe] rounded-2xl p-5 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nomor Tracking</p>
              <p className="text-xl font-mono font-bold text-blue-600">{trackingNumber}</p>
            </div>

            <div className="text-left bg-gray-50 rounded-2xl p-5 mb-8">
              <p className="text-sm font-semibold text-gray-900 mb-3">Alur Persetujuan:</p>
              <div className="space-y-3">
                {[
                  "Staf Treasury (Review & Analisa Kredit)",
                  "Manager (Review & Evaluasi Keuangan)",
                  "Bendahara (Review & Evaluasi Keuangan)",
                  "Ketua (Persetujuan Akhir)",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-600">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/member/dashboard"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Kembali ke Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant="member" userName={userName} onLogout={handleLogout}>
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pengajuan Pinjaman</h1>
            <p className="text-sm text-gray-500">Pilih jenis pinjaman dan isi detail pengajuan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Loan Type Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Jenis Pinjaman</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(LOAN_TYPE_LABELS).map(([key, label]) => {
                const colors = LOAN_TYPE_COLORS[key] || LOAN_TYPE_COLORS.regular;
                const isSelected = loanType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLoanType(key)}
                    className={`p-4 rounded-2xl text-left transition-all border-2 ${
                      isSelected
                        ? `${colors.bg} ${colors.border} ring-1 ring-offset-1 ${colors.border}`
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`mb-2 ${isSelected ? colors.icon : "text-gray-400"}`}>
                      {LOAN_TYPE_ICONS[key]}
                    </div>
                    <p className={`font-semibold text-sm ${isSelected ? colors.text : "text-gray-900"}`}>{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Bunga {INTEREST_RATES[key]}% / tahun</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount & Tenor */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Pinjaman (Rp)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="100000"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f4f7fe] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none"
                placeholder="Masukkan jumlah pinjaman"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tenor (bulan)</label>
              <select
                value={tenor}
                onChange={(e) => setTenor(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f4f7fe] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none"
              >
                <option value="">Pilih tenor</option>
                {[6, 12, 18, 24, 36, 48, 60].map((t) => (
                  <option key={t} value={t}>{t} bulan</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tujuan Pinjaman</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f4f7fe] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none resize-none"
                placeholder="Jelaskan tujuan pinjaman..."
              />
            </div>
          </div>

          {/* Simulation */}
          {monthlyInstallment > 0 && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow-lg shadow-blue-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-blue-200" />
                  <h2 className="font-semibold text-blue-100">Simulasi Angsuran</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-blue-200 mb-1">Pokok Pinjaman</p>
                    <p className="font-bold text-lg">{formatCurrency(parseFloat(amount))}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-blue-200 mb-1">Suku Bunga</p>
                    <p className="font-bold text-lg">{interestRate}% / tahun</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-blue-200 mb-1">Angsuran / Bulan</p>
                    <p className="font-bold text-xl">{formatCurrency(monthlyInstallment)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-blue-200 mb-1">Total Pengembalian</p>
                    <p className="font-bold text-lg">{formatCurrency(totalRepayment)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Approval Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Setelah diajukan, pinjaman akan direview oleh Staf Treasury (analisa kredit), Manager, Bendahara,
              dan Ketua untuk persetujuan akhir. Pencairan melalui proses SPP dan transfer bank.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !loanType || !amount || !tenor}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:shadow-blue-300"
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
