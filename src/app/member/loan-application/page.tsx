"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  FileText,
  Send,
  CheckCircle,
  CreditCard,
  ArrowRight,
  Sparkles,
  Info,
  Package,
  Plane,
  Star,
  Upload,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency, calculateMonthlyInstallment, LOAN_TYPE_LABELS } from "@/lib/utils";

interface LoanTypeConfig {
  label: string;
  coa: string;
  rate: number;
  icon: React.ReactNode;
  colors: { bg: string; border: string; text: string; icon: string };
}

const LOAN_TYPES: Record<string, LoanTypeConfig> = {
  reguler: {
    label: "Pinjaman Reguler",
    coa: "110304",
    rate: 12,
    icon: <CreditCard className="w-6 h-6" />,
    colors: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", icon: "text-teal-600" },
  },
  khusus: {
    label: "Pinjaman Khusus",
    coa: "110305",
    rate: 10,
    icon: <Star className="w-6 h-6" />,
    colors: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-600" },
  },
  barang: {
    label: "Pinjaman Barang",
    coa: "110306",
    rate: 8,
    icon: <Package className="w-6 h-6" />,
    colors: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", icon: "text-purple-600" },
  },
  travel: {
    label: "Pinjaman Travel",
    coa: "110307",
    rate: 10,
    icon: <Plane className="w-6 h-6" />,
    colors: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", icon: "text-sky-600" },
  },
};

export default function LoanApplicationPage() {
  const [loanType, setLoanType] = useState("");
  const [amount, setAmount] = useState("");
  const [tenor, setTenor] = useState("");
  const [purpose, setPurpose] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
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
    setUserEmail(user.email || "");
    setAuthLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/member/login");
  }

  const selectedLoan = loanType ? LOAN_TYPES[loanType] : null;
  const interestRate = selectedLoan ? selectedLoan.rate : 0;
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
      // Upload document if provided
      let documentUrls: string[] = [];
      if (documentFile) {
        const formData = new FormData();
        formData.append("file", documentFile);
        formData.append("type", "loan");
        const uploadRes = await fetch("/api/upload-document", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          documentUrls = [uploadData.url];
        }
      }

      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanType,
          amount: parseFloat(amount),
          tenorMonths: parseInt(tenor),
          purpose,
          interestRate,
          documentUrls: documentUrls.length > 0 ? documentUrls : undefined,
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
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (trackingNumber) {
    return (
      <DashboardLayout variant="member" userName={userName} userEmail={userEmail} onLogout={handleLogout}>
        <div className="max-w-lg mx-auto py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pengajuan Berhasil!</h2>
            <p className="text-sm text-gray-500 mb-6">Pengajuan pinjaman Anda telah diterima dan sedang diproses.</p>

            <div className="bg-[#f0f0f0] rounded-2xl p-5 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nomor Tracking</p>
              <p className="text-xl font-mono font-bold text-teal-600">{trackingNumber}</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left">
              <p className="text-sm font-semibold text-gray-900 mb-3">Alur Persetujuan:</p>
              <div className="space-y-3">
                {[
                  "Staf Treasury (Review & Analisa Kredit)",
                  "Manager (Review & Evaluasi Keuangan)",
                  "Bendahara (Review & Evaluasi Keuangan)",
                  "Ketua (Persetujuan Akhir)",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-600">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/member/dashboard"
              className="inline-flex items-center gap-2 bg-teal-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-teal-600 transition-all shadow-lg shadow-teal-200"
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
    <DashboardLayout variant="member" userName={userName} userEmail={userEmail} onLogout={handleLogout}>
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-teal-600" />
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
              {Object.entries(LOAN_TYPES).map(([key, config]) => {
                const isSelected = loanType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLoanType(key)}
                    className={`p-4 rounded-2xl text-left transition-all border-2 ${
                      isSelected
                        ? `${config.colors.bg} ${config.colors.border} ring-1 ring-offset-1 ${config.colors.border}`
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`mb-2 ${isSelected ? config.colors.icon : "text-gray-400"}`}>
                      {config.icon}
                    </div>
                    <p className={`font-semibold text-sm ${isSelected ? config.colors.text : "text-gray-900"}`}>
                      {config.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Bunga {config.rate}% / tahun</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">COA: {config.coa}</p>
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
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none"
                placeholder="Masukkan jumlah pinjaman"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tenor (bulan)</label>
              <select
                value={tenor}
                onChange={(e) => setTenor(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none"
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
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f0f0f0] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none resize-none"
                placeholder="Jelaskan tujuan pinjaman..."
              />
            </div>
          </div>

          {/* Simulation */}
          {monthlyInstallment > 0 && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 p-6 text-white shadow-lg shadow-teal-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-teal-200" />
                  <h2 className="font-semibold text-teal-100">Simulasi Angsuran</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-teal-200 mb-1">Pokok Pinjaman</p>
                    <p className="font-bold text-lg">{formatCurrency(parseFloat(amount))}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-teal-200 mb-1">Suku Bunga</p>
                    <p className="font-bold text-lg">{interestRate}% / tahun</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-teal-200 mb-1">Angsuran / Bulan</p>
                    <p className="font-bold text-xl">{formatCurrency(monthlyInstallment)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-teal-200 mb-1">Total Pengembalian</p>
                    <p className="font-bold text-lg">{formatCurrency(totalRepayment)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Dokumen Pendukung (Opsional)</h2>
            <p className="text-xs text-gray-500 mb-3">
              Upload dokumen pendukung seperti slip gaji, surat keterangan, atau dokumen lainnya (PDF, maks 5MB).
            </p>
            <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-all">
              <Upload className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                {documentFile ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{documentFile.name}</span>
                    <span className="text-xs text-gray-400">({(documentFile.size / 1024).toFixed(0)} KB)</span>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setDocumentFile(null); }}
                      className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Klik untuk memilih file PDF</span>
                )}
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size <= 5 * 1024 * 1024) setDocumentFile(file);
                  else if (file) alert("Ukuran file maks 5MB");
                }}
                className="hidden"
              />
            </label>
          </div>

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
            className="w-full bg-teal-500 text-white py-3.5 rounded-xl font-semibold hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-200 hover:shadow-teal-300"
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
