"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency, PO_STATUS_LABELS } from "@/lib/utils";
import {
  ShoppingCart, Package, CheckCircle2, Clock, Loader2, ArrowRight,
  FileText, Upload, Download, X, Eye, Edit3, Plus, Trash2, CheckSquare, Square,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PoItem {
  id?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice?: string;
}

interface PurchaseOrder {
  id: string;
  trackingNumber: string;
  poNumber: string;
  description: string;
  status: string;
  estimatedAmount?: string;
  totalAmount?: string;
  vendorName?: string;
  receiptDocumentUrl?: string;
  invoiceDocumentUrl?: string;
  invoiceNumber?: string;
  taxInvoiceNumber?: string;
  paymentRef?: string;
  paymentProofUrl?: string;
  sppId?: string | null;
  sppRef?: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function PengurusPOPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [userRole, setUserRole] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Upload Tanda Terima modal
  const [uploadModalPoId, setUploadModalPoId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // View document modal
  const [viewDocUrl, setViewDocUrl] = useState<string | null>(null);

  // Edit PO modal (staf pengadaan)
  const [editModalPo, setEditModalPo] = useState<PurchaseOrder | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editItems, setEditItems] = useState<PoItem[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  // Invoice upload modal (staf piutang)
  const [invoiceModalPoId, setInvoiceModalPoId] = useState<string | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [taxInvoiceNumber, setTaxInvoiceNumber] = useState("");
  const [invoiceUploading, setInvoiceUploading] = useState(false);

  // Payment proof upload modal (staf akunting)
  const [paymentModalPoId, setPaymentModalPoId] = useState<string | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);

  // Batch selection (staf pengadaan)
  const [selectedPoIds, setSelectedPoIds] = useState<Set<string>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);

  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/pengurus/login");
        return;
      }
      setUserName(
        user.user_metadata?.full_name || user.email?.split("@")[0] || "Pengurus"
      );
      setUserEmail(user.email || "");

      const roleRes = await fetch("/api/approvals?view=all");
      if (roleRes.ok) {
        const roleData = await roleRes.json();
        setUserRole(roleData.userRole || "");
      }

      const res = await fetch("/api/purchase-orders?view=all");
      if (res.ok) {
        const data = await res.json();
        setPurchaseOrders(data.purchaseOrders || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/pengurus/login");
  }

  /* ---- Status update ---- */

  async function updatePOStatus(poId: string, newStatus: string, extra?: Record<string, unknown>) {
    setUpdatingId(poId);
    try {
      const res = await fetch(`/api/po/${poId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extra }),
      });
      if (res.ok) {
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal mengupdate status");
      }
    } catch {
      alert("Gagal mengupdate status");
    } finally {
      setUpdatingId(null);
    }
  }

  /* ---- Upload Tanda Terima ---- */

  async function handleUploadAndDeliver(poId: string) {
    if (!uploadFile) {
      alert("Silakan pilih file Tanda Terima Barang terlebih dahulu");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("type", "tanda-terima");
      const uploadRes = await fetch("/api/upload-document", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        alert(err.error || "Gagal mengupload file");
        return;
      }
      const { url } = await uploadRes.json();

      const statusRes = await fetch(`/api/po/${poId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "goods_delivered", receiptDocumentUrl: url }),
      });
      if (statusRes.ok) {
        setUploadModalPoId(null);
        setUploadFile(null);
        loadData();
      } else {
        const data = await statusRes.json();
        alert(data.error || "Gagal mengupdate status");
      }
    } catch {
      alert("Gagal mengupload dan mengupdate status");
    } finally {
      setUploading(false);
    }
  }

  /* ---- Edit PO (staf pengadaan) ---- */

  async function openEditModal(po: PurchaseOrder) {
    setEditModalPo(po);
    setEditDescription(po.description);
    // Fetch items
    try {
      const res = await fetch(`/api/purchase-orders/${po.id}`);
      if (res.ok) {
        const data = await res.json();
        const items = (data.items || []).map((item: PoItem & { totalPrice?: string }) => ({
          itemName: item.itemName,
          description: item.description || "",
          quantity: item.quantity,
          unit: item.unit || "pcs",
          unitPrice: typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : item.unitPrice,
        }));
        setEditItems(items.length > 0 ? items : [{ itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0 }]);
      }
    } catch {
      setEditItems([{ itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0 }]);
    }
  }

  async function handleSaveEdit() {
    if (!editModalPo) return;
    setEditSaving(true);
    try {
      const validItems = editItems.filter((i) => i.itemName.trim() && i.unitPrice > 0);
      const totalAmount = validItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

      const res = await fetch(`/api/purchase-orders/${editModalPo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editDescription,
          estimatedAmount: totalAmount > 0 ? totalAmount : undefined,
          items: validItems.length > 0 ? validItems : undefined,
        }),
      });
      if (res.ok) {
        setEditModalPo(null);
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyimpan perubahan");
      }
    } catch {
      alert("Gagal menyimpan perubahan");
    } finally {
      setEditSaving(false);
    }
  }

  /* ---- Invoice Upload (staf piutang) ---- */

  async function handleInvoiceUpload(poId: string) {
    if (!invoiceFile || !invoiceNumber.trim()) {
      alert("Nomor invoice dan file lampiran wajib diisi");
      return;
    }
    setInvoiceUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", invoiceFile);
      formData.append("type", "invoice");
      const uploadRes = await fetch("/api/upload-document", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        alert(err.error || "Gagal mengupload file");
        return;
      }
      const { url } = await uploadRes.json();

      const statusRes = await fetch(`/api/po/${poId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "invoicing",
          invoiceNumber: invoiceNumber.trim(),
          invoiceDocumentUrl: url,
          taxInvoiceNumber: taxInvoiceNumber.trim() || undefined,
        }),
      });
      if (statusRes.ok) {
        setInvoiceModalPoId(null);
        setInvoiceFile(null);
        setInvoiceNumber("");
        setTaxInvoiceNumber("");
        loadData();
      } else {
        const data = await statusRes.json();
        alert(data.error || "Gagal mengupdate status");
      }
    } catch {
      alert("Gagal mengupload invoice");
    } finally {
      setInvoiceUploading(false);
    }
  }

  /* ---- Payment Proof Upload & Complete (staf akunting) ---- */

  async function handlePaymentProofUpload(poId: string) {
    if (!paymentProofFile) {
      alert("Bukti pembayaran masuk wajib diupload");
      return;
    }
    setPaymentSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", paymentProofFile);
      formData.append("type", "payment_proof");
      const uploadRes = await fetch("/api/upload-document", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        alert(err.error || "Gagal mengupload file");
        return;
      }
      const { url } = await uploadRes.json();

      const res = await fetch(`/api/po/${poId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", paymentProofUrl: url }),
      });
      if (res.ok) {
        setPaymentModalPoId(null);
        setPaymentProofFile(null);
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyelesaikan PO");
      }
    } catch {
      alert("Gagal mengupload bukti pembayaran");
    } finally {
      setPaymentSaving(false);
    }
  }

  /* ---- Batch Process (staf pengadaan) ---- */

  function toggleSelection(poId: string) {
    setSelectedPoIds((prev) => {
      const next = new Set(prev);
      if (next.has(poId)) next.delete(poId);
      else next.add(poId);
      return next;
    });
  }

  const batchEligiblePos = purchaseOrders.filter(
    (po) => ["review_pengadaan", "pricing"].includes(po.status)
  );

  function toggleSelectAll() {
    if (selectedPoIds.size === batchEligiblePos.length) {
      setSelectedPoIds(new Set());
    } else {
      setSelectedPoIds(new Set(batchEligiblePos.map((po) => po.id)));
    }
  }

  async function handleBatchApproval() {
    if (selectedPoIds.size === 0) return;
    setBatchProcessing(true);
    try {
      // Move all selected POs to pending_manager status
      const results = await Promise.allSettled(
        Array.from(selectedPoIds).map((poId) =>
          fetch(`/api/purchase-orders/${poId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "pending_manager" }),
          })
        )
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        alert(`${failed} PO gagal diproses`);
      }
      setSelectedPoIds(new Set());
      loadData();
    } catch {
      alert("Gagal memproses batch approval");
    } finally {
      setBatchProcessing(false);
    }
  }

  /* ---- Helpers ---- */

  const ROLE_DISPLAY: Record<string, string> = {
    staf_treasury: "Staf Treasury",
    staf_pengadaan: "Staf Pengadaan",
    staf_piutang: "Staf Piutang",
    staf_akunting: "Staf Akunting",
  };

  function getNextAction(status: string): { label: string; nextStatus: string; needsInput?: string; requiredRole: string } | null {
    switch (status) {
      case "approved_rab": return { label: "Buat SPP", nextStatus: "", needsInput: "spp", requiredRole: "staf_treasury" };
      case "spp_process": return { label: "Proses Pengadaan", nextStatus: "procurement", requiredRole: "staf_pengadaan" };
      case "procurement": return { label: "Kirim Barang", nextStatus: "delivery", requiredRole: "staf_pengadaan" };
      case "delivery": return { label: "Barang Diterima", nextStatus: "goods_received", requiredRole: "staf_piutang" };
      case "goods_received": return { label: "Upload Tanda Terima & Kirim", nextStatus: "goods_delivered", needsInput: "upload_receipt", requiredRole: "staf_piutang" };
      case "goods_delivered": return { label: "Upload Invoice & Proses", nextStatus: "invoicing", needsInput: "upload_invoice", requiredRole: "staf_piutang" };
      case "invoicing": return { label: "Menunggu Bayar", nextStatus: "waiting_payment", requiredRole: "staf_akunting" };
      case "waiting_payment": return { label: "Upload Bukti & Selesaikan", nextStatus: "completed", needsInput: "upload_payment_proof", requiredRole: "staf_akunting" };
      default: return null;
    }
  }

  function getStatusBadgeClasses(status: string): string {
    if (["completed"].includes(status))
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (["rejected"].includes(status))
      return "bg-red-50 text-red-700 border border-red-200";
    if (["draft"].includes(status))
      return "bg-gray-100 text-gray-600 border border-gray-200";
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  const totalPO = purchaseOrders.length;
  const pendingPO = purchaseOrders.filter(
    (po) => !["completed", "rejected"].includes(po.status)
  ).length;
  const completedPO = purchaseOrders.filter(
    (po) => po.status === "completed"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat data purchase orders...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      variant="pengurus"
      userName={userName}
      userEmail={userEmail}
      onLogout={handleLogout}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-sm text-gray-500 mt-0.5">Kelola semua purchase order koperasi</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total PO</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalPO}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">PO Pending</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingPO}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">PO Completed</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{completedPO}</p>
        </div>
      </div>

      {/* ── Batch Selection Bar (staf_pengadaan) ── */}
      {userRole === "staf_pengadaan" && batchEligiblePos.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={toggleSelectAll} className="text-indigo-600 hover:text-indigo-800 transition">
              {selectedPoIds.size === batchEligiblePos.length ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
            <p className="text-sm text-indigo-700">
              <span className="font-semibold">{selectedPoIds.size}</span> dari {batchEligiblePos.length} PO dipilih untuk diproses ke approval
            </p>
          </div>
          {selectedPoIds.size > 0 && (
            <button
              onClick={handleBatchApproval}
              disabled={batchProcessing}
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {batchProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              Kirim {selectedPoIds.size} PO ke Approval
            </button>
          )}
        </div>
      )}

      {/* PO Table */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-5">
          {purchaseOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Belum ada purchase order.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                    {userRole === "staf_pengadaan" && batchEligiblePos.length > 0 && (
                      <th className="pb-3 font-medium w-8"></th>
                    )}
                    <th className="pb-3 font-medium">PO Number</th>
                    <th className="pb-3 font-medium">Deskripsi</th>
                    <th className="pb-3 font-medium">Vendor</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium text-right">Jumlah</th>
                    <th className="pb-3 font-medium">Tanggal</th>
                    <th className="pb-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => {
                    const action = getNextAction(po.status);
                    const isBatchEligible = ["review_pengadaan", "pricing"].includes(po.status);
                    const showReceiptLink = po.receiptDocumentUrl && action?.needsInput !== "upload_receipt";
                    const showInvoiceLink = po.invoiceDocumentUrl;

                    return (
                      <tr key={po.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                        {/* Batch checkbox */}
                        {userRole === "staf_pengadaan" && batchEligiblePos.length > 0 && (
                          <td className="py-3.5">
                            {isBatchEligible ? (
                              <button onClick={() => toggleSelection(po.id)} className="text-indigo-500 hover:text-indigo-700">
                                {selectedPoIds.has(po.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                              </button>
                            ) : (
                              <span />
                            )}
                          </td>
                        )}
                        <td className="py-3.5">
                          <span className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded-md">
                            {po.poNumber || po.trackingNumber}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">{po.description}</p>
                        </td>
                        <td className="py-3.5 text-gray-500">{po.vendorName || "-"}</td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-medium ${getStatusBadgeClasses(po.status)}`}>
                            {PO_STATUS_LABELS[po.status] || po.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-semibold text-gray-900">
                          {formatCurrency(po.totalAmount || po.estimatedAmount || "0")}
                        </td>
                        <td className="py-3.5 text-gray-500 text-xs">
                          {new Date(po.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            {/* Edit button for staf_pengadaan on review/pricing */}
                            {userRole === "staf_pengadaan" && isBatchEligible && (
                              <button
                                onClick={() => openEditModal(po)}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 font-medium transition"
                                title="Edit Detail PO"
                              >
                                <Edit3 className="w-3 h-3" /> Edit
                              </button>
                            )}

                            {/* Document links */}
                            {showReceiptLink && (
                              <button
                                onClick={() => setViewDocUrl(po.receiptDocumentUrl!)}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition"
                                title="Lihat Tanda Terima"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            )}
                            {showInvoiceLink && (
                              <button
                                onClick={() => setViewDocUrl(po.invoiceDocumentUrl!)}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium transition"
                                title="Lihat Invoice"
                              >
                                <FileText className="w-3 h-3" />
                              </button>
                            )}

                            {/* Action buttons */}
                            {(() => {
                              if (!action) return null;
                              if (userRole !== action.requiredRole) {
                                return <span className="text-[10px] text-gray-400 italic">Menunggu {ROLE_DISPLAY[action.requiredRole] || action.requiredRole}</span>;
                              }
                              if (action.needsInput === "spp") {
                                // If SPP already created, show info instead of button
                                if (po.sppId) {
                                  return (
                                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-teal-50 text-teal-600 rounded-lg font-medium">
                                      <FileText className="w-3 h-3" /> SPP Dibuat {po.sppRef ? `(${po.sppRef})` : ""}
                                    </span>
                                  );
                                }
                                return (
                                  <button
                                    onClick={() => router.push(`/pengurus/spp/create?type=purchase_order&ref=${po.id}`)}
                                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium transition"
                                  >
                                    <FileText className="w-3 h-3" /> Buat SPP
                                  </button>
                                );
                              }
                              if (action.needsInput === "upload_receipt") {
                                return (
                                  <button
                                    onClick={() => setUploadModalPoId(po.id)}
                                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 font-medium transition"
                                  >
                                    <Upload className="w-3 h-3" /> Tanda Terima
                                  </button>
                                );
                              }
                              if (action.needsInput === "upload_invoice") {
                                return (
                                  <button
                                    onClick={() => setInvoiceModalPoId(po.id)}
                                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium transition"
                                  >
                                    <Upload className="w-3 h-3" /> Invoice
                                  </button>
                                );
                              }
                              if (action.needsInput === "upload_payment_proof") {
                                return (
                                  <button
                                    onClick={() => setPaymentModalPoId(po.id)}
                                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 font-medium transition"
                                  >
                                    <Upload className="w-3 h-3" /> Bukti Bayar
                                  </button>
                                );
                              }
                              return (
                                <button
                                  onClick={() => updatePOStatus(po.id, action.nextStatus)}
                                  disabled={updatingId === po.id}
                                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 font-medium transition disabled:opacity-50"
                                >
                                  {updatingId === po.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                                  {action.label}
                                </button>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {purchaseOrders.length > 0 && (
                <div className="pt-4 border-t border-gray-100 mt-2">
                  <p className="text-xs text-gray-400">Menampilkan {purchaseOrders.length} purchase order.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  MODALS                                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* ── Upload Tanda Terima Modal ── */}
      {uploadModalPoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Tanda Terima Barang</h3>
              <button onClick={() => { setUploadModalPoId(null); setUploadFile(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Upload dokumen Tanda Terima Barang. Format: PDF, JPEG, PNG, atau WebP (maks 5MB).</p>
            <div className="mb-4">
              <label className="block">
                <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${uploadFile ? "border-teal-300 bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5 text-teal-600" />
                      <span className="text-sm font-medium text-teal-700">{uploadFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Klik untuk memilih file</p>
                    </>
                  )}
                </div>
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setUploadModalPoId(null); setUploadFile(null); }} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Batal</button>
              <button
                onClick={() => handleUploadAndDeliver(uploadModalPoId)}
                disabled={!uploadFile || uploading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengupload...</> : <><Upload className="w-4 h-4" /> Upload & Kirim</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invoice Upload Modal (staf piutang) ── */}
      {invoiceModalPoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Invoice & Lampiran</h3>
              <button onClick={() => { setInvoiceModalPoId(null); setInvoiceFile(null); setInvoiceNumber(""); setTaxInvoiceNumber(""); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Invoice *</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  placeholder="INV-2026-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Faktur Pajak</label>
                <input
                  type="text"
                  value={taxInvoiceNumber}
                  onChange={(e) => setTaxInvoiceNumber(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  placeholder="010.000-26.00000001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Invoice / Lampiran *</label>
                <label className="block">
                  <div className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${invoiceFile ? "border-green-300 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)} />
                    {invoiceFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">{invoiceFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-7 h-7 text-gray-300 mx-auto mb-1" />
                        <p className="text-sm text-gray-400">PDF, JPEG, PNG (maks 5MB)</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setInvoiceModalPoId(null); setInvoiceFile(null); setInvoiceNumber(""); setTaxInvoiceNumber(""); }} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Batal</button>
              <button
                onClick={() => handleInvoiceUpload(invoiceModalPoId)}
                disabled={!invoiceFile || !invoiceNumber.trim() || invoiceUploading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {invoiceUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengupload...</> : <><Upload className="w-4 h-4" /> Upload Invoice</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit PO Modal (staf pengadaan) ── */}
      {editModalPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Detail PO - {editModalPo.poNumber}</h3>
              <button onClick={() => setEditModalPo(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Detail Barang</label>
                  <button
                    onClick={() => setEditItems([...editItems, { itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0 }])}
                    className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Item
                  </button>
                </div>
                <div className="space-y-3">
                  {editItems.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">Item {idx + 1}</span>
                        {editItems.length > 1 && (
                          <button onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => { const newItems = [...editItems]; newItems[idx] = { ...item, itemName: e.target.value }; setEditItems(newItems); }}
                        placeholder="Nama barang"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400">Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => { const newItems = [...editItems]; newItems[idx] = { ...item, quantity: parseInt(e.target.value) || 1 }; setEditItems(newItems); }}
                            min="1"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400">Satuan</label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => { const newItems = [...editItems]; newItems[idx] = { ...item, unit: e.target.value }; setEditItems(newItems); }}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400">Harga Satuan</label>
                          <input
                            type="number"
                            value={item.unitPrice || ""}
                            onChange={(e) => { const newItems = [...editItems]; newItems[idx] = { ...item, unitPrice: parseFloat(e.target.value) || 0 }; setEditItems(newItems); }}
                            min="0"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 text-right">
                        Subtotal: {formatCurrency(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    Total: {formatCurrency(editItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditModalPo(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Batal</button>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {editSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Edit3 className="w-4 h-4" /> Simpan Perubahan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Proof Upload Modal (staf akunting) ── */}
      {paymentModalPoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Bukti Pembayaran</h3>
              <button onClick={() => { setPaymentModalPoId(null); setPaymentProofFile(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800">
                Upload bukti pembayaran masuk (foto/scan) untuk menyelesaikan PO ini. Pastikan dokumen terlihat jelas.
              </p>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Bukti Pembayaran Masuk <span className="text-red-500">*</span></label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-600 hover:file:bg-emerald-100 transition cursor-pointer"
              />
              {paymentProofFile && (
                <p className="text-xs text-gray-500">File: {paymentProofFile.name}</p>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setPaymentModalPoId(null); setPaymentProofFile(null); }} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Batal</button>
              <button
                onClick={() => handlePaymentProofUpload(paymentModalPoId)}
                disabled={!paymentProofFile || paymentSaving}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {paymentSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengupload...</> : <><CheckCircle2 className="w-4 h-4" /> Selesaikan PO</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Document Modal ── */}
      {viewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Dokumen</h3>
              <div className="flex items-center gap-2">
                <a
                  href={viewDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition"
                >
                  <Download className="w-3 h-3" /> Download
                </a>
                <button onClick={() => setViewDocUrl(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto rounded-xl bg-gray-50 border border-gray-100">
              {viewDocUrl.match(/\.(jpg|jpeg|png|webp)/i) ? (
                <img src={viewDocUrl} alt="Dokumen" className="w-full h-auto object-contain" />
              ) : (
                <iframe src={viewDocUrl} className="w-full h-[70vh]" title="Dokumen" />
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
