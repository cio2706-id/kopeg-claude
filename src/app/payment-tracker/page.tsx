"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Search, Package, CheckCircle, Clock, XCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DashboardLayout variant="member" userName={userName} onLogout={handleLogout}>
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mb-4">
            <Package className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Lacak Pembayaran</h1>
          <p className="text-sm text-gray-500 mt-1">Masukkan nomor tracking untuk melihat status permintaan Anda.</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Masukkan nomor tracking (contoh: PR260201ABCD)"
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Cari"
            )}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 mb-6 text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Result Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Nomor Tracking</p>
                  <p className="font-mono font-bold text-lg text-gray-900">{result.trackingNumber}</p>
                </div>
                <div className="flex items-center gap-2 bg-[#f4f7fe] rounded-xl px-3.5 py-2">
                  {STATUS_ICONS[result.status]}
                  <span className="text-sm font-semibold text-gray-700">{PAYMENT_STATUS_LABELS[result.status]}</span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f4f7fe] rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Kategori</p>
                  <p className="font-semibold text-gray-900">{result.category || "-"}</p>
                </div>
                <div className="bg-[#f4f7fe] rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Jumlah</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(result.amount)}</p>
                </div>
                {result.adjustedAmount && (
                  <div className="bg-orange-50 rounded-xl p-4 col-span-2">
                    <p className="text-xs text-orange-600 mb-1">Jumlah Disesuaikan</p>
                    <p className="font-semibold text-orange-700">{formatCurrency(result.adjustedAmount)}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Deskripsi</p>
                <p className="text-sm text-gray-900">{result.description}</p>
              </div>

              {/* Approval Steps */}
              {approvalSteps.length > 0 && (
                <div className="pt-5 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 mb-4">Status Persetujuan</p>
                  <div className="space-y-2.5">
                    {approvalSteps
                      .sort((a, b) => a.stepOrder - b.stepOrder)
                      .map((step) => (
                        <div key={step.id} className="flex items-center gap-3 text-sm bg-[#f4f7fe] rounded-xl px-4 py-3">
                          {step.action === "approve" ? (
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          ) : step.action === "reject" ? (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-300 shrink-0" />
                          )}
                          <span className="text-gray-700 font-medium capitalize">{step.approverRole}</span>
                          {step.action && (
                            <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Tidak ditemukan data untuk nomor tracking tersebut.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
