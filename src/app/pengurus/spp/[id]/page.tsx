"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency } from "@/lib/utils";
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Download,
  Send,
  CreditCard,
  ShoppingCart,
  User,
} from "lucide-react";

interface SppDetail {
  id: string;
  sppNumber: string;
  referenceType: string | null;
  referenceId: string | null;
  unitKerja: string;
  requestDate: string;
  payableTo: string;
  totalAmount: string;
  amountInWords: string | null;
  supportingDocs: string | null;
  hasPph23: boolean;
  pphDetails: unknown;
  totalInvoice: string | null;
  pphDue: string | null;
  status: string;
  createdBy: string;
  approvedByTreasury: string | null;
  approvedByTreasuryAt: string | null;
  approvedByManager: string | null;
  approvedByManagerAt: string | null;
  approvedByBendahara: string | null;
  approvedByBendaharaAt: string | null;
  notes: string | null;
  createdAt: string;
  creatorName: string;
}

interface SppItemRecord {
  id: string;
  accountCode: string;
  description: string;
  amount: string;
  sortOrder: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  pending_manager: { label: "Menunggu Manager", color: "bg-amber-50 text-amber-700" },
  pending_bendahara: { label: "Menunggu Bendahara", color: "bg-blue-50 text-blue-700" },
  approved: { label: "Disetujui", color: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Ditolak", color: "bg-red-50 text-red-700" },
};

export default function SppDetailPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sppData, setSppData] = useState<SppDetail | null>(null);
  const [items, setItems] = useState<SppItemRecord[]>([]);
  const [approverNames, setApproverNames] = useState<Record<string, string>>({});
  const [comments, setComments] = useState("");

  const router = useRouter();
  const params = useParams();
  const sppId = params.id as string;
  const supabase = createSupabaseBrowserClient();

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/pengurus/login"); return; }
      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Pengurus");
      setUserEmail(user.email || "");

      // Get user role from API
      const userRes = await fetch("/api/approvals?view=all");
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserRole(userData.userRole || "");
      }

      const res = await fetch(`/api/spp/${sppId}`);
      if (res.ok) {
        const data = await res.json();
        setSppData(data.spp);
        setItems(data.items || []);
        setApproverNames(data.approverNames || {});
      }
    } catch (error) {
      console.error("Failed to load:", error);
    } finally {
      setLoading(false);
    }
  }, [router, supabase, sppId]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleApproval(action: "approve" | "reject") {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/spp/${sppId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comments }),
      });
      if (res.ok) {
        loadData();
        setComments("");
      } else {
        const data = await res.json();
        alert(data.error || "Gagal memproses");
      }
    } catch {
      alert("Gagal memproses");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/pengurus/login");
  }

  // Can current user act on this SPP?
  function canAct(): boolean {
    if (!sppData) return false;
    if (sppData.status === "draft" && userRole === "staf_treasury") return true;
    if (sppData.status === "pending_manager" && userRole === "manager") return true;
    if (sppData.status === "pending_bendahara" && userRole === "bendahara") return true;
    return false;
  }

  function getActionLabel(): string {
    if (!sppData) return "";
    if (sppData.status === "draft") return "Ajukan ke Manager";
    if (sppData.status === "pending_manager") return "Setujui";
    if (sppData.status === "pending_bendahara") return "Setujui";
    return "";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!sppData) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <p className="text-gray-500">SPP tidak ditemukan</p>
      </div>
    );
  }

  const sc = STATUS_CONFIG[sppData.status] || STATUS_CONFIG.draft;

  return (
    <DashboardLayout variant="pengurus" userName={userName} userEmail={userEmail} onLogout={handleLogout}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/pengurus/spp")} className="p-2 rounded-lg hover:bg-gray-200 transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{sppData.sppNumber}</h1>
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${sc.color}`}>
                {sc.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Dibuat oleh {sppData.creatorName} &mdash;{" "}
              {new Date(sppData.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        {sppData.status === "approved" && (
          <button
            onClick={() => window.open(`/pengurus/spp/${sppId}/print`, "_blank")}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white text-sm font-medium rounded-xl hover:bg-indigo-600 transition"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* SPP Details */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Detail Permintaan</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 text-xs">Unit Kerja</span>
                <p className="text-gray-900 font-medium">{sppData.unitKerja}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Tanggal Permintaan</span>
                <p className="text-gray-900 font-medium">
                  {new Date(sppData.requestDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Dibayarkan Kepada</span>
                <p className="text-gray-900 font-medium">{sppData.payableTo}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Jumlah</span>
                <p className="text-gray-900 font-bold text-lg">{formatCurrency(Number(sppData.totalAmount))}</p>
              </div>
              {sppData.referenceType && (
                <div>
                  <span className="text-gray-500 text-xs">Referensi</span>
                  <p className="inline-flex items-center gap-1 text-sm text-indigo-600 font-medium">
                    {sppData.referenceType === "loan" ? <CreditCard className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                    {sppData.referenceType === "loan" ? "Pinjaman" : "Purchase Order"}
                  </p>
                </div>
              )}
              {sppData.amountInWords && (
                <div className="col-span-2">
                  <span className="text-gray-500 text-xs">Terbilang</span>
                  <p className="text-gray-900 italic">{sppData.amountInWords}</p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Rincian Pembayaran</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-3 font-medium w-24">No. Akun</th>
                  <th className="pb-3 font-medium">Keterangan</th>
                  <th className="pb-3 font-medium text-right">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="py-3 text-gray-600 font-mono text-xs">{item.accountCode}</td>
                    <td className="py-3 text-gray-900">{item.description}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(Number(item.amount))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={2} className="py-3 font-bold text-gray-900">TOTAL</td>
                  <td className="py-3 text-right font-bold text-gray-900 text-lg">{formatCurrency(Number(sppData.totalAmount))}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* PPh 23 Section */}
          {sppData.hasPph23 && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Pemotongan PPh 23</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Total Tagihan</span>
                  <p className="text-gray-900 font-medium">{formatCurrency(Number(sppData.totalInvoice || 0))}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">PPh 23 (Harus Bayar)</span>
                  <p className="text-gray-900 font-medium">{formatCurrency(Number(sppData.pphDue || 0))}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Approval Timeline */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Alur Persetujuan</h2>
            <div className="space-y-4">
              {[
                {
                  role: "Staf Treasury",
                  approvedBy: sppData.approvedByTreasury,
                  approvedAt: sppData.approvedByTreasuryAt,
                  isActive: sppData.status === "draft",
                },
                {
                  role: "Manager",
                  approvedBy: sppData.approvedByManager,
                  approvedAt: sppData.approvedByManagerAt,
                  isActive: sppData.status === "pending_manager",
                },
                {
                  role: "Bendahara",
                  approvedBy: sppData.approvedByBendahara,
                  approvedAt: sppData.approvedByBendaharaAt,
                  isActive: sppData.status === "pending_bendahara",
                },
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.approvedBy
                      ? "bg-emerald-100"
                      : step.isActive
                      ? "bg-amber-100"
                      : "bg-gray-100"
                  }`}>
                    {step.approvedBy ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : step.isActive ? (
                      <Clock className="w-4 h-4 text-amber-600" />
                    ) : (
                      <User className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${step.approvedBy ? "text-emerald-700" : step.isActive ? "text-amber-700" : "text-gray-400"}`}>
                      {step.role}
                    </p>
                    {step.approvedBy && (
                      <p className="text-xs text-gray-500">
                        {approverNames[step.approvedBy] || "—"} &mdash;{" "}
                        {step.approvedAt
                          ? new Date(step.approvedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                          : ""}
                      </p>
                    )}
                    {step.isActive && !step.approvedBy && (
                      <p className="text-xs text-amber-600">Menunggu persetujuan...</p>
                    )}
                  </div>
                </div>
              ))}

              {sppData.status === "rejected" && (
                <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-700">Ditolak</p>
                    {sppData.notes && <p className="text-xs text-red-600 mt-0.5">{sppData.notes}</p>}
                  </div>
                </div>
              )}

              {sppData.status === "approved" && (
                <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-700">SPP Disetujui</p>
                    <p className="text-xs text-gray-500">Dokumen siap diunduh</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {canAct() && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Tindakan</h2>
              <div className="space-y-3">
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Komentar (opsional)..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                />
                <button
                  onClick={() => handleApproval("approve")}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-600 disabled:opacity-50 transition"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {getActionLabel()}
                </button>
                <button
                  onClick={() => handleApproval("reject")}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 disabled:opacity-50 transition"
                >
                  <XCircle className="w-4 h-4" />
                  Tolak
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          {sppData.notes && sppData.status !== "rejected" && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Catatan</h2>
              <p className="text-sm text-gray-600">{sppData.notes}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
