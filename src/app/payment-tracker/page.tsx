"use client";

import { useState } from "react";
import { Search, Package, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { formatCurrency, PAYMENT_STATUS_LABELS } from "@/lib/utils";

interface PaymentRequest {
  id: string;
  trackingNumber: string;
  description: string;
  amount: string;
  adjustedAmount?: string;
  status: string;
  category?: string;
  createdAt: string;
}

interface ApprovalRecord {
  id: string;
  approverRole: string;
  action?: string;
  comments?: string;
  stepOrder: number;
  decidedAt?: string;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-5 h-5 text-yellow-500" />,
  in_review: <Clock className="w-5 h-5 text-blue-500" />,
  adjusted: <Package className="w-5 h-5 text-orange-500" />,
  approved: <CheckCircle className="w-5 h-5 text-green-500" />,
  rejected: <XCircle className="w-5 h-5 text-red-500" />,
  completed: <CheckCircle className="w-5 h-5 text-green-600" />,
};

export default function PaymentTrackerPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [result, setResult] = useState<PaymentRequest | null>(null);
  const [approvalSteps, setApprovalSteps] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/payment-requests?tracking=${encodeURIComponent(trackingNumber.trim())}`);

      if (!res.ok) {
        if (res.status === 404) {
          setResult(null);
          setApprovalSteps([]);
          setError("Nomor tracking tidak ditemukan.");
          return;
        }
        throw new Error("Gagal mencari data");
      }

      const data = await res.json();
      setResult(data.paymentRequest);
      setApprovalSteps(data.approvals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Package className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Lacak Pembayaran</h1>
          <p className="text-sm text-gray-500 mt-1">Masukkan nomor tracking untuk melihat status permintaan Anda.</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Masukkan nomor tracking (contoh: PR260201ABCD)"
              className="w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "..." : "Cari"}
          </button>
        </form>

        {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

        {result && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-5 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Nomor Tracking</p>
                  <p className="font-mono font-bold text-lg text-gray-900">{result.trackingNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  {STATUS_ICONS[result.status]}
                  <span className="text-sm font-medium">{PAYMENT_STATUS_LABELS[result.status]}</span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Kategori</p>
                  <p className="font-medium text-gray-900">{result.category || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Jumlah</p>
                  <p className="font-medium text-gray-900">{formatCurrency(result.amount)}</p>
                </div>
                {result.adjustedAmount && (
                  <div>
                    <p className="text-gray-500">Jumlah Disesuaikan</p>
                    <p className="font-medium text-orange-600">{formatCurrency(result.adjustedAmount)}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-gray-500 text-sm">Deskripsi</p>
                <p className="text-sm text-gray-900 mt-1">{result.description}</p>
              </div>

              {approvalSteps.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-900 mb-3">Status Persetujuan</p>
                  <div className="space-y-2">
                    {approvalSteps
                      .sort((a, b) => a.stepOrder - b.stepOrder)
                      .map((step) => (
                        <div key={step.id} className="flex items-center gap-3 text-sm">
                          {step.action === "approve" ? (
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          ) : step.action === "reject" ? (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-300 shrink-0" />
                          )}
                          <span className="text-gray-600 capitalize">{step.approverRole}</span>
                          {step.action && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              step.action === "approve" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}>
                              {step.action === "approve" ? "Disetujui" : "Ditolak"}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {searched && !result && !error && (
          <p className="text-gray-500 text-sm text-center">Tidak ditemukan data untuk nomor tracking tersebut.</p>
        )}
      </main>
    </div>
  );
}
