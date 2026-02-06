"use client";

import { useState } from "react";
import { FileText, ArrowLeft, Calculator, Send } from "lucide-react";
import Link from "next/link";
import { formatCurrency, calculateMonthlyInstallment, LOAN_TYPE_LABELS } from "@/lib/utils";

const INTEREST_RATES: Record<string, number> = {
  regular: 12,
  emergency: 6,
  education: 10,
  housing: 8,
};

export default function LoanApplicationPage() {
  const [loanType, setLoanType] = useState("");
  const [amount, setAmount] = useState("");
  const [tenor, setTenor] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);

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

  if (trackingNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pengajuan Berhasil!</h2>
          <div className="mb-4">
            <p className="text-xs text-gray-500">Nomor Tracking</p>
            <p className="text-lg font-mono font-bold text-blue-600">{trackingNumber}</p>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Pengajuan pinjaman Anda akan direview melalui alur berikut:
          </p>
          <div className="text-xs text-gray-500 mb-6 space-y-1">
            <p>1. Staf Treasury (Review & Analisa Kredit)</p>
            <p>2. Manager (Review & Evaluasi Keuangan)</p>
            <p>3. Bendahara (Review & Evaluasi Keuangan)</p>
            <p>4. Ketua (Persetujuan Akhir)</p>
          </div>
          <Link
            href="/member/dashboard"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/member/dashboard" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <FileText className="w-5 h-5 text-blue-600" />
          <h1 className="font-semibold text-gray-900">Pengajuan Pinjaman</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Loan Type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-medium text-gray-900 mb-3">Jenis Pinjaman</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(LOAN_TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLoanType(key)}
                  className={`p-3 border rounded-lg text-sm text-left transition ${
                    loanType === key
                      ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Bunga {INTEREST_RATES[key]}% / tahun</p>
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Tenor */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pinjaman (Rp)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="100000"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenor (bulan)</label>
              <select
                value={tenor}
                onChange={(e) => setTenor(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih tenor</option>
                {[6, 12, 18, 24, 36, 48, 60].map((t) => (
                  <option key={t} value={t}>{t} bulan</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan Pinjaman</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Jelaskan tujuan pinjaman..."
              />
            </div>
          </div>

          {/* Simulation */}
          {monthlyInstallment > 0 && (
            <div className="bg-blue-50 rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-blue-600" />
                <h2 className="font-medium text-blue-900">Simulasi Angsuran</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-600">Pokok Pinjaman</p>
                  <p className="font-bold text-blue-900">{formatCurrency(parseFloat(amount))}</p>
                </div>
                <div>
                  <p className="text-blue-600">Suku Bunga</p>
                  <p className="font-bold text-blue-900">{interestRate}% / tahun</p>
                </div>
                <div>
                  <p className="text-blue-600">Angsuran / Bulan</p>
                  <p className="font-bold text-blue-900 text-lg">{formatCurrency(monthlyInstallment)}</p>
                </div>
                <div>
                  <p className="text-blue-600">Total Pengembalian</p>
                  <p className="font-bold text-blue-900">{formatCurrency(totalRepayment)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              Setelah diajukan, pinjaman akan direview oleh Staf Treasury (analisa kredit), Manager, Bendahara,
              dan Ketua untuk persetujuan akhir. Pencairan melalui proses SPP dan transfer bank.
            </p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !loanType || !amount || !tenor}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Memproses..." : "Ajukan Pinjaman"}
          </button>
        </form>
      </main>
    </div>
  );
}
