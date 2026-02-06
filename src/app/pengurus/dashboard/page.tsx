"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Shield,
  Users,
  CreditCard,
  FileCheck,
  ShoppingCart,
  LogOut,
  Check,
  X,
  Upload,
  Search,
} from "lucide-react";
import {
  formatCurrency,
  ROLE_LABELS,
  PO_STATUS_LABELS,
} from "@/lib/utils";

type Tab = "po" | "loans" | "payments" | "members";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
  isActive: boolean;
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
  createdAt: string;
}

interface Approval {
  id: string;
  referenceType: string;
  referenceId: string;
  approverRole: string;
  action?: string;
  stepOrder: number;
  stepLabel?: string;
}

export default function PengurusDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("po");
  const [members, setMembers] = useState<User[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const loadData = useCallback(async () => {
    try {
      const [membersRes, approvalsRes, poRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/approvals"),
        fetch("/api/purchase-orders"),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.users || []);
      }
      if (approvalsRes.ok) {
        const data = await approvalsRes.json();
        setPendingApprovals(data.approvals || []);
      }
      if (poRes.ok) {
        const data = await poRes.json();
        setPurchaseOrders(data.purchaseOrders || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/pengurus/login");
        return;
      }
      setUserRole(user.user_metadata?.role || "staf_treasury");
      loadData();
    }
    init();
  }, [router, supabase, loadData]);

  async function handleApproval(
    approvalId: string,
    action: "approve" | "reject",
    comments?: string
  ) {
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, action, comments }),
      });
      if (res.ok) loadData();
    } catch (error) {
      console.error("Approval failed:", error);
    }
  }

  async function handleUpdateUser(id: string, data: Partial<User>) {
    try {
      await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      loadData();
    } catch (error) {
      console.error("Update failed:", error);
    }
  }

  async function handleUpdatePoStatus(poId: string, status: string) {
    try {
      await fetch(`/api/purchase-orders/${poId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadData();
    } catch (error) {
      console.error("PO update failed:", error);
    }
  }

  async function handleUploadSavings(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("period", new Date().toISOString().slice(0, 7));
    try {
      const res = await fetch("/api/savings/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      alert(
        `Upload selesai: ${data.processed} data diproses. ${data.errors?.length || 0} error.`
      );
    } catch {
      alert("Upload gagal");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/pengurus/login");
  }

  const filteredMembers = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loanApprovals = pendingApprovals.filter(
    (a) => a.referenceType === "loan" && !a.action
  );
  const poApprovals = pendingApprovals.filter(
    (a) => a.referenceType === "purchase_order" && !a.action
  );
  const paymentApprovals = pendingApprovals.filter(
    (a) => a.referenceType === "payment_request" && !a.action
  );

  const tabs: {
    key: Tab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      key: "po",
      label: "Purchase Orders",
      icon: <ShoppingCart className="w-4 h-4" />,
      count: poApprovals.length,
    },
    {
      key: "loans",
      label: "Pinjaman",
      icon: <CreditCard className="w-4 h-4" />,
      count: loanApprovals.length,
    },
    {
      key: "payments",
      label: "Pembayaran",
      icon: <FileCheck className="w-4 h-4" />,
      count: paymentApprovals.length,
    },
    { key: "members", label: "Anggota", icon: <Users className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <div>
              <p className="font-bold text-sm">Dashboard Pengurus</p>
              <p className="text-xs text-gray-400">
                {ROLE_LABELS[userRole] || userRole}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm hover:bg-gray-800 px-3 py-1.5 rounded transition"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ─── PO Tab ─────────────────────────────── */}
        {activeTab === "po" && (
          <div className="space-y-6">
            {poApprovals.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Menunggu Persetujuan Anda
                </h2>
                <p className="text-sm text-gray-500">
                  Alur PO: Client → Staf Pengadaan (review & harga) → Manager
                  (approval RAB) → Staf Treasury (SPP & pembelian) → Staf Piutang
                  (invoice) → Staf Akunting (pembayaran)
                </p>
                {poApprovals.map((approval) => (
                  <div key={approval.id} className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          PO #{approval.referenceId.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Step {approval.stepOrder} -{" "}
                          {approval.stepLabel || ROLE_LABELS[approval.approverRole]}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproval(approval.id, "approve")}
                          className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition"
                        >
                          <Check className="w-3 h-3" /> Setujui
                        </button>
                        <button
                          onClick={() => handleApproval(approval.id, "reject", "Ditolak")}
                          className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition"
                        >
                          <X className="w-3 h-3" /> Tolak
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Semua Purchase Orders
              </h2>
              {purchaseOrders.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Belum ada Purchase Order.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b text-left text-gray-500">
                          <th className="px-4 py-3 font-medium">No. PO</th>
                          <th className="px-4 py-3 font-medium">Deskripsi</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Estimasi</th>
                          <th className="px-4 py-3 font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrders.map((po) => (
                          <tr key={po.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-xs">{po.poNumber}</td>
                            <td className="px-4 py-3 text-gray-900 max-w-[200px] truncate">{po.description}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                po.status === "completed" ? "bg-green-100 text-green-700"
                                : po.status === "rejected" ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                              }`}>
                                {PO_STATUS_LABELS[po.status] || po.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {po.totalAmount ? formatCurrency(po.totalAmount)
                                : po.estimatedAmount ? formatCurrency(po.estimatedAmount)
                                : "-"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1 flex-wrap">
                                {po.status === "approved_rab" && (
                                  <button onClick={() => handleUpdatePoStatus(po.id, "spp_process")} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Proses SPP</button>
                                )}
                                {po.status === "spp_process" && (
                                  <button onClick={() => handleUpdatePoStatus(po.id, "procurement")} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Beli ke Vendor</button>
                                )}
                                {po.status === "procurement" && (
                                  <button onClick={() => handleUpdatePoStatus(po.id, "delivery")} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Kirim Vendor</button>
                                )}
                                {po.status === "delivery" && (
                                  <button onClick={() => handleUpdatePoStatus(po.id, "goods_received")} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Barang Diterima</button>
                                )}
                                {po.status === "goods_received" && (
                                  <button onClick={() => handleUpdatePoStatus(po.id, "goods_delivered")} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Kirim ke Client</button>
                                )}
                                {po.status === "goods_delivered" && (
                                  <button onClick={() => handleUpdatePoStatus(po.id, "invoicing")} className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700">Buat Invoice</button>
                                )}
                                {po.status === "invoicing" && (
                                  <button onClick={() => handleUpdatePoStatus(po.id, "waiting_payment")} className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700">Kirim Invoice</button>
                                )}
                                {po.status === "waiting_payment" && (
                                  <button onClick={() => handleUpdatePoStatus(po.id, "payment_received")} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Bayar Diterima</button>
                                )}
                                {po.status === "payment_received" && (
                                  <button onClick={() => handleUpdatePoStatus(po.id, "completed")} className="text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-900">Selesai</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Loans Tab ──────────────────────────── */}
        {activeTab === "loans" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Persetujuan Pinjaman</h2>
            <p className="text-sm text-gray-500">
              Alur: Staf Treasury (analisa kredit) → Manager (evaluasi keuangan) → Bendahara
              (evaluasi keuangan) → Ketua (persetujuan akhir) → SPP Accurate → Bank → Pencairan
            </p>
            {loanApprovals.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Tidak ada pinjaman yang menunggu persetujuan.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {loanApprovals.map((approval) => (
                  <div key={approval.id} className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Pinjaman #{approval.referenceId.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">
                          Step {approval.stepOrder} - {approval.stepLabel || ROLE_LABELS[approval.approverRole]}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproval(approval.id, "approve")} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition">
                          <Check className="w-3 h-3" /> Setujui
                        </button>
                        <button onClick={() => handleApproval(approval.id, "reject", "Ditolak")} className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition">
                          <X className="w-3 h-3" /> Tolak
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Payments Tab ───────────────────────── */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Permintaan Pembayaran</h2>
            {paymentApprovals.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Tidak ada permintaan pembayaran yang menunggu.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentApprovals.map((approval) => (
                  <div key={approval.id} className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Pembayaran #{approval.referenceId.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">Step {approval.stepOrder} - {ROLE_LABELS[approval.approverRole]}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproval(approval.id, "approve")} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition">
                          <Check className="w-3 h-3" /> Setujui
                        </button>
                        <button onClick={() => handleApproval(approval.id, "reject", "Ditolak")} className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition">
                          <X className="w-3 h-3" /> Tolak
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Members Tab ────────────────────────── */}
        {activeTab === "members" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari anggota..."
                  className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <label className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 cursor-pointer transition">
                <Upload className="w-4 h-4" />
                Upload Simpanan
                <input type="file" accept=".xlsx,.xls" onChange={handleUploadSavings} className="hidden" />
              </label>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-left text-gray-500">
                      <th className="px-4 py-3 font-medium">Nama</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Departemen</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{member.fullName}</td>
                        <td className="px-4 py-3 text-gray-600">{member.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateUser(member.id, { role: e.target.value } as Partial<User>)}
                            className="text-xs border rounded px-2 py-1"
                          >
                            {Object.entries(ROLE_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{member.department || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${member.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {member.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleUpdateUser(member.id, { isActive: !member.isActive })} className="text-xs text-red-600 hover:underline">
                            {member.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
