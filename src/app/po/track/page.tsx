"use client";

import { useState } from "react";
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
import Navbar from "@/components/Navbar";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Package className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Lacak Purchase Order</h1>
          <p className="text-sm text-gray-500 mt-1">
            Masukkan nomor tracking PO untuk melihat status.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Masukkan nomor tracking (contoh: PO260201ABCD)"
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

        {error && (
          <p className="text-red-600 text-sm text-center mb-4">{error}</p>
        )}

        {po && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-5 border-b">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500">Nomor PO</p>
                  <p className="font-mono font-bold text-gray-900">
                    {po.poNumber}
                  </p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
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

              {po.status !== "rejected" && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Deskripsi</p>
                <p className="text-sm text-gray-900">{po.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {po.estimatedAmount && (
                  <div>
                    <p className="text-gray-500">Estimasi</p>
                    <p className="font-medium">{formatCurrency(po.estimatedAmount)}</p>
                  </div>
                )}
                {po.totalAmount && (
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-medium">{formatCurrency(po.totalAmount)}</p>
                  </div>
                )}
                {po.vendorName && (
                  <div>
                    <p className="text-gray-500">Vendor</p>
                    <p className="font-medium">{po.vendorName}</p>
                  </div>
                )}
                {po.invoiceNumber && (
                  <div>
                    <p className="text-gray-500">Invoice</p>
                    <p className="font-medium">{po.invoiceNumber}</p>
                  </div>
                )}
              </div>

              {/* Flow Timeline */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-900 mb-3">
                  Alur Proses PO
                </p>
                <div className="space-y-3">
                  {[
                    { key: "submitted", icon: <FileText className="w-4 h-4" />, label: "PO Dikirim" },
                    { key: "review_pengadaan", icon: <Search className="w-4 h-4" />, label: "Review Staf Pengadaan" },
                    { key: "pending_manager", icon: <CheckCircle className="w-4 h-4" />, label: "Approval Manager (RAB)" },
                    { key: "spp_process", icon: <CreditCard className="w-4 h-4" />, label: "Proses SPP & Pembelian" },
                    { key: "goods_received", icon: <Truck className="w-4 h-4" />, label: "Barang Diterima & Dikirim" },
                    { key: "invoicing", icon: <FileText className="w-4 h-4" />, label: "Invoicing & Faktur Pajak" },
                    { key: "waiting_payment", icon: <Clock className="w-4 h-4" />, label: "Pembayaran & Pencatatan" },
                    { key: "completed", icon: <CheckCircle className="w-4 h-4" />, label: "PO Selesai" },
                  ].map((step) => {
                    const stepProgress = STATUS_PROGRESS[step.key] || 0;
                    const isComplete = progress >= stepProgress && po.status !== "rejected";
                    const isCurrent =
                      progress >= stepProgress - 10 &&
                      progress < stepProgress + 10 &&
                      po.status !== "rejected" &&
                      po.status !== "completed";

                    return (
                      <div key={step.key} className="flex items-center gap-3 text-sm">
                        <div
                          className={`shrink-0 ${
                            isComplete
                              ? "text-green-500"
                              : isCurrent
                              ? "text-blue-500"
                              : "text-gray-300"
                          }`}
                        >
                          {step.icon}
                        </div>
                        <span
                          className={
                            isComplete
                              ? "text-gray-900 font-medium"
                              : isCurrent
                              ? "text-blue-600 font-medium"
                              : "text-gray-400"
                          }
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
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-900 mb-3">
                    Status Persetujuan
                  </p>
                  <div className="space-y-2">
                    {approvalSteps
                      .sort((a, b) => a.stepOrder - b.stepOrder)
                      .map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-3 text-sm"
                        >
                          {step.action === "approve" ? (
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          ) : step.action === "reject" ? (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-300 shrink-0" />
                          )}
                          <span className="text-gray-600">
                            {ROLE_LABELS[step.approverRole] || step.approverRole}
                          </span>
                          {step.stepLabel && (
                            <span className="text-xs text-gray-400">
                              ({step.stepLabel})
                            </span>
                          )}
                          {step.action && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
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
          <p className="text-gray-500 text-sm text-center">
            Tidak ditemukan data untuk nomor tracking tersebut.
          </p>
        )}
      </main>
    </div>
  );
}
