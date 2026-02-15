"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency, PO_STATUS_LABELS } from "@/lib/utils";
import { ShoppingCart, Package, CheckCircle2, Clock, Loader2, ArrowRight, FileText, Upload, Download, X, Eye } from "lucide-react";

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
  createdAt: string;
}

export default function PengurusPOPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [userRole, setUserRole] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [uploadModalPoId, setUploadModalPoId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewDocUrl, setViewDocUrl] = useState<string | null>(null);
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

      // Get user role
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

  async function updatePOStatus(poId: string, newStatus: string) {
    setUpdatingId(poId);
    try {
      const res = await fetch(`/api/po/${poId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
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

  async function handleUploadAndDeliver(poId: string) {
    if (!uploadFile) {
      alert("Silakan pilih file Tanda Terima Barang terlebih dahulu");
      return;
    }
    setUploading(true);
    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("type", "tanda-terima");
      const uploadRes = await fetch("/api/upload-document", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        alert(err.error || "Gagal mengupload file");
        return;
      }
      const { url } = await uploadRes.json();

      // 2. Update PO status with receipt document URL
      const statusRes = await fetch(`/api/po/${poId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "goods_delivered",
          receiptDocumentUrl: url,
        }),
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
      case "goods_delivered": return { label: "Proses Invoice", nextStatus: "invoicing", needsInput: "view_receipt", requiredRole: "staf_akunting" };
      case "invoicing": return { label: "Menunggu Bayar", nextStatus: "waiting_payment", requiredRole: "staf_akunting" };
      case "waiting_payment": return { label: "Bayar Diterima", nextStatus: "payment_received", requiredRole: "staf_treasury" };
      case "payment_received": return { label: "Selesai", nextStatus: "completed", requiredRole: "staf_akunting" };
      default: return null;
    }
  }

  function getStatusBadgeClasses(status: string): string {
    if (["completed", "payment_received"].includes(status))
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (["rejected"].includes(status))
      return "bg-red-50 text-red-700 border border-red-200";
    if (["draft"].includes(status))
      return "bg-gray-100 text-gray-600 border border-gray-200";
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  const totalPO = purchaseOrders.length;
  const pendingPO = purchaseOrders.filter(
    (po) => !["completed", "rejected", "payment_received"].includes(po.status)
  ).length;
  const completedPO = purchaseOrders.filter(
    (po) => po.status === "completed" || po.status === "payment_received"
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
            <p className="text-sm text-gray-500 mt-0.5">
              Kelola semua purchase order koperasi
            </p>
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
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Total PO
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalPO}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              PO Pending
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingPO}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              PO Completed
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{completedPO}</p>
        </div>
      </div>

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
                  {purchaseOrders.map((po) => (
                    <tr
                      key={po.id}
                      className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3.5">
                        <span className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded-md">
                          {po.poNumber || po.trackingNumber}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">
                          {po.description}
                        </p>
                      </td>
                      <td className="py-3.5 text-gray-500">
                        {po.vendorName || "-"}
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-medium ${getStatusBadgeClasses(po.status)}`}
                        >
                          {PO_STATUS_LABELS[po.status] || po.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-semibold text-gray-900">
                        {formatCurrency(po.totalAmount || po.estimatedAmount || "0")}
                      </td>
                      <td className="py-3.5 text-gray-500 text-xs">
                        {new Date(po.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5">
                        {(() => {
                          const action = getNextAction(po.status);
                          // Show receipt document link for any PO that has it (post-delivery statuses)
                          const showReceiptLink = po.receiptDocumentUrl && !action?.needsInput?.includes("receipt");

                          if (!action) {
                            return showReceiptLink ? (
                              <button
                                onClick={() => setViewDocUrl(po.receiptDocumentUrl!)}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition"
                                title="Lihat Tanda Terima"
                              >
                                <Eye className="w-3 h-3" /> Tanda Terima
                              </button>
                            ) : <span className="text-xs text-gray-300">—</span>;
                          }
                          if (userRole !== action.requiredRole) {
                            return (
                              <div className="flex items-center gap-1.5">
                                {showReceiptLink && (
                                  <button
                                    onClick={() => setViewDocUrl(po.receiptDocumentUrl!)}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition"
                                    title="Lihat Tanda Terima"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                )}
                                <span className="text-[10px] text-gray-400 italic">Menunggu {ROLE_DISPLAY[action.requiredRole] || action.requiredRole}</span>
                              </div>
                            );
                          }
                          if (action.needsInput === "spp") {
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
                                <Upload className="w-3 h-3" /> Upload Tanda Terima
                              </button>
                            );
                          }
                          if (action.needsInput === "view_receipt") {
                            return (
                              <div className="flex items-center gap-1.5">
                                {po.receiptDocumentUrl && (
                                  <button
                                    onClick={() => setViewDocUrl(po.receiptDocumentUrl!)}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition"
                                    title="Lihat Tanda Terima"
                                  >
                                    <Eye className="w-3 h-3" /> Tanda Terima
                                  </button>
                                )}
                                <button
                                  onClick={() => updatePOStatus(po.id, action.nextStatus)}
                                  disabled={updatingId === po.id}
                                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 font-medium transition disabled:opacity-50"
                                >
                                  {updatingId === po.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <ArrowRight className="w-3 h-3" />
                                  )}
                                  Invoice
                                </button>
                              </div>
                            );
                          }
                          return (
                            <button
                              onClick={() => updatePOStatus(po.id, action.nextStatus)}
                              disabled={updatingId === po.id}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 font-medium transition disabled:opacity-50"
                            >
                              {updatingId === po.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <ArrowRight className="w-3 h-3" />
                              )}
                              {action.label}
                            </button>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {purchaseOrders.length > 0 && (
                <div className="pt-4 border-t border-gray-100 mt-2">
                  <p className="text-xs text-gray-400">
                    Menampilkan {purchaseOrders.length} purchase order.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Upload Tanda Terima Modal */}
      {uploadModalPoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Tanda Terima Barang</h3>
              <button
                onClick={() => { setUploadModalPoId(null); setUploadFile(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Upload dokumen Tanda Terima Barang sebelum mengirim barang ke client. Format: PDF, JPEG, PNG, atau WebP (maks 5MB).
            </p>
            <div className="mb-4">
              <label className="block">
                <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${uploadFile ? "border-teal-300 bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5 text-teal-600" />
                      <span className="text-sm font-medium text-teal-700">{uploadFile.name}</span>
                      <span className="text-xs text-gray-400">({(uploadFile.size / 1024).toFixed(0)} KB)</span>
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
              <button
                onClick={() => { setUploadModalPoId(null); setUploadFile(null); }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={() => handleUploadAndDeliver(uploadModalPoId)}
                disabled={!uploadFile || uploading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload & Kirim
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Tanda Terima Modal */}
      {viewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tanda Terima Barang</h3>
              <div className="flex items-center gap-2">
                <a
                  href={viewDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition"
                >
                  <Download className="w-3 h-3" /> Download
                </a>
                <button
                  onClick={() => setViewDocUrl(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto rounded-xl bg-gray-50 border border-gray-100">
              {viewDocUrl.match(/\.(jpg|jpeg|png|webp)/i) ? (
                <img
                  src={viewDocUrl}
                  alt="Tanda Terima Barang"
                  className="w-full h-auto object-contain"
                />
              ) : (
                <iframe
                  src={viewDocUrl}
                  className="w-full h-[70vh]"
                  title="Tanda Terima Barang"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
