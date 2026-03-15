"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  FileText,
  CreditCard,
  Building2,
  ArrowLeft,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatCurrency, PO_STATUS_LABELS, ROLE_LABELS } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
  invoiceDocumentUrl?: string;
  receiptDocumentUrl?: string;
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

function getStatusBadgeClasses(status: string): string {
  if (["completed", "payment_received"].includes(status))
    return "bg-green-100 text-green-700";
  if (["rejected"].includes(status))
    return "bg-red-100 text-red-700";
  return "bg-teal-100 text-teal-700";
}

export default function PoTrackPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [approvalSteps, setApprovalSteps] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // My POs list (for logged-in users)
  const [myPOs, setMyPOs] = useState<PurchaseOrder[]>([]);
  const [myPOsLoading, setMyPOsLoading] = useState(false);
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);
  const [poApprovals, setPoApprovals] = useState<Record<string, ApprovalRecord[]>>({});

  const supabase = createSupabaseBrowserClient();

  const loadMyPOs = useCallback(async () => {
    setMyPOsLoading(true);
    try {
      const res = await fetch("/api/purchase-orders?my=true");
      if (res.ok) {
        const data = await res.json();
        setMyPOs(data.purchaseOrders || []);
      }
    } catch {
      // Silently ignore
    } finally {
      setMyPOsLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsLoggedIn(true);
        loadMyPOs();
      }
    });
  }, [supabase, loadMyPOs]);

  async function handleExpandPO(poItem: PurchaseOrder) {
    if (expandedPoId === poItem.id) {
      setExpandedPoId(null);
      return;
    }
    setExpandedPoId(poItem.id);

    // Fetch approvals for this PO if not cached
    if (!poApprovals[poItem.id]) {
      try {
        const res = await fetch(`/api/purchase-orders?tracking=${encodeURIComponent(poItem.trackingNumber)}`);
        if (res.ok) {
          const data = await res.json();
          setPoApprovals((prev) => ({ ...prev, [poItem.id]: data.approvals || [] }));
        }
      } catch {
        // Silently ignore
      }
    }
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

  function renderPODetail(poData: PurchaseOrder, steps: ApprovalRecord[]) {
    const progress = STATUS_PROGRESS[poData.status] || 0;

    return (
      <div className="p-5 border-t border-gray-100 space-y-5">
        {/* Progress Bar */}
        {poData.status !== "rejected" && (
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {poData.estimatedAmount && (
            <div className="bg-[#f4f7fe] rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Estimasi</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(poData.estimatedAmount)}</p>
            </div>
          )}
          {poData.totalAmount && (
            <div className="bg-[#f4f7fe] rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(poData.totalAmount)}</p>
            </div>
          )}
          {poData.vendorName && (
            <div className="bg-[#f4f7fe] rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Vendor</p>
              <p className="text-sm font-semibold text-gray-900">{poData.vendorName}</p>
            </div>
          )}
          {poData.invoiceNumber && (
            <div className="bg-[#f4f7fe] rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Invoice</p>
              <p className="text-sm font-semibold text-gray-900">{poData.invoiceNumber}</p>
            </div>
          )}
        </div>

        {/* Documents */}
        {(poData.invoiceDocumentUrl || poData.receiptDocumentUrl) && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-900 mb-3">Dokumen</p>
            <div className="flex flex-wrap gap-3">
              {poData.invoiceDocumentUrl && (
                <a href={poData.invoiceDocumentUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-100 transition">
                  <FileText className="w-4 h-4" />
                  <span>Invoice{poData.invoiceNumber ? ` (${poData.invoiceNumber})` : ""}</span>
                  <Download className="w-3.5 h-3.5 ml-1" />
                </a>
              )}
              {poData.receiptDocumentUrl && (
                <a href={poData.receiptDocumentUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-100 transition">
                  <Eye className="w-4 h-4" />
                  <span>Tanda Terima Barang</span>
                  <Download className="w-3.5 h-3.5 ml-1" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Flow Timeline */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-900 mb-4">Alur Proses PO</p>
          <div className="space-y-1">
            {[
              { key: "submitted", icon: <FileText className="w-4 h-4" />, label: "PO Diajukan" },
              { key: "review_pengadaan", icon: <Search className="w-4 h-4" />, label: "Review Staf Pengadaan" },
              { key: "pending_manager", icon: <CheckCircle className="w-4 h-4" />, label: "Approval Manager (RAB)" },
              { key: "spp_process", icon: <CreditCard className="w-4 h-4" />, label: "Proses SPP & Pembelian" },
              { key: "goods_received", icon: <Truck className="w-4 h-4" />, label: "Barang Diterima & Dikirim" },
              { key: "invoicing", icon: <FileText className="w-4 h-4" />, label: "Invoicing & Faktur Pajak" },
              { key: "waiting_payment", icon: <Clock className="w-4 h-4" />, label: "Pembayaran & Pencatatan" },
              { key: "completed", icon: <CheckCircle className="w-4 h-4" />, label: "PO Selesai" },
            ].map((step, index) => {
              const stepProgress = STATUS_PROGRESS[step.key] || 0;
              const isComplete = progress >= stepProgress && poData.status !== "rejected";
              const isCurrent = progress >= stepProgress - 10 && progress < stepProgress + 10 && poData.status !== "rejected" && poData.status !== "completed";

              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isComplete ? "bg-green-100 text-green-600" : isCurrent ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-300"}`}>
                      {step.icon}
                    </div>
                    {index < 7 && (
                      <div className={`w-0.5 h-4 ${isComplete ? "bg-green-200" : "bg-gray-100"}`} />
                    )}
                  </div>
                  <span className={`text-sm pb-4 ${isComplete ? "text-gray-900 font-medium" : isCurrent ? "text-teal-600 font-semibold" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Approval Steps */}
        {steps.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-900 mb-4">Status Persetujuan</p>
            <div className="space-y-2.5">
              {steps.sort((a, b) => a.stepOrder - b.stepOrder).map((step) => (
                <div key={step.id} className="flex items-center gap-3 text-sm bg-[#f4f7fe] rounded-xl px-4 py-3">
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
                    <span className="text-xs text-gray-400">({step.stepLabel})</span>
                  )}
                  {step.action && (
                    <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${step.action === "approve" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {step.action === "approve" ? "Disetujui" : "Ditolak"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const progress = po ? STATUS_PROGRESS[po.status] || 0 : 0;

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Header */}
      <header className="bg-[#1a1a2e] text-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">KopegBKI</span>
          </div>
          <Link
            href={isLoggedIn ? "/member/dashboard" : "/"}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isLoggedIn ? "Kembali ke Dashboard" : "Kembali ke Beranda"}
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-100 rounded-2xl mb-4">
            <Package className="w-7 h-7 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Lacak Purchase Order</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLoggedIn ? "Daftar semua PO yang Anda ajukan." : "Masukkan nomor tracking PO untuk melihat status."}
          </p>
        </div>

        {/* My POs List (for logged-in users) */}
        {isLoggedIn && (
          <div className="mb-8">
            {myPOsLoading ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs text-gray-400">Memuat daftar PO Anda...</p>
              </div>
            ) : myPOs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Anda belum memiliki Purchase Order.</p>
                <Link
                  href="/po/request"
                  className="inline-flex items-center gap-2 bg-teal-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-600 transition mt-4"
                >
                  Buat PO Baru
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-gray-700">Purchase Order Anda ({myPOs.length})</h2>
                  <Link
                    href="/po/request"
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                  >
                    + Buat PO Baru
                  </Link>
                </div>
                {[...myPOs]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((poItem) => {
                    const isExpanded = expandedPoId === poItem.id;
                    return (
                      <div
                        key={poItem.id}
                        className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all ${isExpanded ? "ring-2 ring-teal-200" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => handleExpandPO(poItem)}
                          className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50/50 transition"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-teal-600 font-medium">{poItem.poNumber}</span>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${getStatusBadgeClasses(poItem.status)}`}>
                                {PO_STATUS_LABELS[poItem.status] || poItem.status}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate">{poItem.description}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(poItem.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-gray-900">
                              {formatCurrency(poItem.totalAmount || poItem.estimatedAmount || "0")}
                            </p>
                          </div>
                          <div className="text-gray-400 shrink-0">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </button>

                        {isExpanded && renderPODetail(poItem, poApprovals[poItem.id] || [])}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Search Form (for non-logged-in users, or additional search for logged-in) */}
        {!isLoggedIn && (
          <>
            <form onSubmit={handleSearch} className="flex gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Masukkan nomor tracking (contoh: PO260201ABCD)"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none shadow-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-600 disabled:opacity-50 transition-all shadow-lg shadow-teal-200"
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
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Nomor PO</p>
                      <p className="font-mono font-bold text-lg text-gray-900">{po.poNumber}</p>
                    </div>
                    <span className={`text-xs px-3.5 py-1.5 rounded-full font-semibold ${getStatusBadgeClasses(po.status)}`}>
                      {PO_STATUS_LABELS[po.status] || po.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{po.description}</p>
                </div>
                {renderPODetail(po, approvalSteps)}
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
          </>
        )}
      </main>
    </div>
  );
}
