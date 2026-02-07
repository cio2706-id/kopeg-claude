"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Search,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  FileText,
  CreditCard,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency, PO_STATUS_LABELS, ROLE_LABELS } from "@/lib/utils";

interface PurchaseOrder {
  id: string;
  trackingNumber: string;
  poNumber: string;
  description: string;
  status: string;
  estimatedAmount?: string;
  totalAmount?: string;
  vendorName?: string;
  invoiceNumber?: string;
  createdAt: string;
}

interface ApprovalRecord {
  id: string;
  approverRole: string;
  action?: string;
  comments?: string;
  stepOrder: number;
  stepLabel?: string;
  decidedAt?: string;
}

const STATUS_PROGRESS: Record<string, number> = {
  draft: 0,
  submitted: 5,
  review_pengadaan: 10,
  pricing: 15,
  pending_manager: 20,
  approved_rab: 30,
  spp_process: 40,
  procurement: 50,
  delivery: 60,
  goods_received: 70,
  goods_delivered: 75,
  invoicing: 80,
  waiting_payment: 90,
  payment_received: 95,
  completed: 100,
  rejected: 0,
};

export default function PoTrackPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [approvalSteps, setApprovalSteps] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/purchase-orders?tracking=${encodeURIComponent(trackingNumber.trim())}`
      );

      if (!res.ok) {
        if (res.status === 404) {
          setPo(null);
          setError("Nomor tracking tidak ditemukan.");
          return;
        }
        throw new Error("Gagal mencari data");
      }

      const data = await res.json();
      setPo(data.purchaseOrder);
      setApprovalSteps(data.approvals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setPo(null);
    } finally {
      setLoading(false);
    }
  }

  const progress = po ? STATUS_PROGRESS[po.status] || 0 : 0;

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
          <h1 className="text-2xl font-bold text-gray-900">Lacak Purchase Order</h1>
          <p className="text-sm text-gray-500 mt-1">
            Masukkan nomor tracking PO untuk melihat status.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Masukkan nomor tracking (contoh: PO260201ABCD)"
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

        {po && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* PO Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Nomor PO</p>
                  <p className="font-mono font-bold text-lg text-gray-900">
                    {po.poNumber}
                  </p>
                </div>
                <span
                  className={`text-xs px-3.5 py-1.5 rounded-full font-semibold ${
                    po.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : po.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {PO_STATUS_LABELS[po.status] || po.status}
                </span>
              </div>

              {/* Progress Bar */}
              {po.status !== "rejected" && (
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            <div className="p-6 space-y-5">
              {/* Description */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Deskripsi</p>
                <p className="text-sm text-gray-900">{po.description}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {po.estimatedAmount && (
                  <div className="bg-[#f4f7fe] rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Estimasi</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(po.estimatedAmount)}</p>
                  </div>
                )}
                {po.totalAmount && (
                  <div className="bg-[#f4f7fe] rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Total</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(po.totalAmount)}</p>
                  </div>
                )}
                {po.vendorName && (
                  <div className="bg-[#f4f7fe] rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Vendor</p>
                    <p className="font-semibold text-gray-900">{po.vendorName}</p>
                  </div>
                )}
                {po.invoiceNumber && (
                  <div className="bg-[#f4f7fe] rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Invoice</p>
                    <p className="font-semibold text-gray-900">{po.invoiceNumber}</p>
                  </div>
                )}
              </div>

              {/* Flow Timeline */}
              <div className="pt-5 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-900 mb-4">
                  Alur Proses PO
                </p>
                <div className="space-y-1">
                  {[
                    { key: "submitted", icon: <FileText className="w-4 h-4" />, label: "PO Dikirim" },
                    { key: "review_pengadaan", icon: <Search className="w-4 h-4" />, label: "Review Staf Pengadaan" },
                    { key: "pending_manager", icon: <CheckCircle className="w-4 h-4" />, label: "Approval Manager (RAB)" },
                    { key: "spp_process", icon: <CreditCard className="w-4 h-4" />, label: "Proses SPP & Pembelian" },
                    { key: "goods_received", icon: <Truck className="w-4 h-4" />, label: "Barang Diterima & Dikirim" },
                    { key: "invoicing", icon: <FileText className="w-4 h-4" />, label: "Invoicing & Faktur Pajak" },
                    { key: "waiting_payment", icon: <Clock className="w-4 h-4" />, label: "Pembayaran & Pencatatan" },
                    { key: "completed", icon: <CheckCircle className="w-4 h-4" />, label: "PO Selesai" },
                  ].map((step, index) => {
                    const stepProgress = STATUS_PROGRESS[step.key] || 0;
                    const isComplete = progress >= stepProgress && po.status !== "rejected";
                    const isCurrent =
                      progress >= stepProgress - 10 &&
                      progress < stepProgress + 10 &&
                      po.status !== "rejected" &&
                      po.status !== "completed";

                    return (
                      <div key={step.key} className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isComplete
                                ? "bg-green-100 text-green-600"
                                : isCurrent
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-300"
                            }`}
                          >
                            {step.icon}
                          </div>
                          {index < 7 && (
                            <div className={`w-0.5 h-4 ${isComplete ? "bg-green-200" : "bg-gray-100"}`} />
                          )}
                        </div>
                        <span
                          className={`text-sm pb-4 ${
                            isComplete
                              ? "text-gray-900 font-medium"
                              : isCurrent
                              ? "text-blue-600 font-semibold"
                              : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Approval Steps */}
              {approvalSteps.length > 0 && (
                <div className="pt-5 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 mb-4">
                    Status Persetujuan
                  </p>
                  <div className="space-y-2.5">
                    {approvalSteps
                      .sort((a, b) => a.stepOrder - b.stepOrder)
                      .map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-3 text-sm bg-[#f4f7fe] rounded-xl px-4 py-3"
                        >
                          {step.action === "approve" ? (
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          ) : step.action === "reject" ? (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-300 shrink-0" />
                          )}
                          <span className="text-gray-700 font-medium">
                            {ROLE_LABELS[step.approverRole] || step.approverRole}
                          </span>
                          {step.stepLabel && (
                            <span className="text-xs text-gray-400">
                              ({step.stepLabel})
                            </span>
                          )}
                          {step.action && (
                            <span
                              className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${
                                step.action === "approve"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {step.action === "approve"
                                ? "Disetujui"
                                : "Ditolak"}
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

        {searched && !po && !error && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Tidak ditemukan data untuk nomor tracking tersebut.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
