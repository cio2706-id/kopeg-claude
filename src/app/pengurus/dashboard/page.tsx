"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import {
  formatCurrency,
  ROLE_LABELS,
  PO_STATUS_LABELS,
  LOAN_STATUS_LABELS,
} from "@/lib/utils";
import {
  Users,
  CreditCard,
  ShoppingCart,
  Wallet,
  Clock,
  Check,
  X,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
  FileText,
  Upload,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────────────────────

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

interface Loan {
  id: string;
  trackingNumber: string;
  loanType: string;
  amount: string;
  status: string;
  tenorMonths: number;
  monthlyInstallment: string;
  purpose?: string;
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

const PIE_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

// ─── Component ──────────────────────────────────────────────────────────────

export default function PengurusDashboardPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const loadData = useCallback(async () => {
    try {
      const [membersRes, approvalsRes, poRes, loansRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/approvals"),
        fetch("/api/purchase-orders"),
        fetch("/api/loans"),
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
      if (loansRes.ok) {
        const data = await loansRes.json();
        setLoans(data.loans || []);
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
      setUserName(
        user.user_metadata?.full_name || user.email?.split("@")[0] || "Pengurus"
      );
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
    setActionLoading(approvalId);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, action, comments }),
      });
      if (res.ok) loadData();
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setActionLoading(null);
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

  // ─── Derived data ───────────────────────────────────────────────────────

  const loanApprovals = pendingApprovals.filter(
    (a) => a.referenceType === "loan" && !a.action
  );
  const poApprovals = pendingApprovals.filter(
    (a) => a.referenceType === "purchase_order" && !a.action
  );

  const allPendingApprovals = [...loanApprovals, ...poApprovals];

  const activeMembers = members.filter((m) => m.isActive);

  const totalLoanAmount = loans.reduce(
    (sum, l) => sum + parseFloat(l.amount || "0"),
    0
  );

  const pendingLoans = loans.filter(
    (l) =>
      !["approved", "disbursed", "rejected", "draft"].includes(l.status)
  );

  const pendingPOs = purchaseOrders.filter(
    (po) => !["completed", "rejected"].includes(po.status)
  );

  // Chart: PO status distribution
  const poStatusCounts: Record<string, number> = {};
  purchaseOrders.forEach((po) => {
    const label = PO_STATUS_LABELS[po.status] || po.status;
    poStatusCounts[label] = (poStatusCounts[label] || 0) + 1;
  });
  const poChartData = Object.entries(poStatusCounts)
    .map(([name, value]) => ({ name, value }))
    .slice(0, 6);

  // Chart: Loan by month (last 6 months)
  const loanByMonth: Record<string, number> = {};
  loans.forEach((loan) => {
    const date = new Date(loan.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    loanByMonth[key] = (loanByMonth[key] || 0) + parseFloat(loan.amount || "0");
  });
  const loanBarData = Object.entries(loanByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([period, amount]) => ({ period, amount }));

  // Role distribution for members
  const roleCounts: Record<string, number> = {};
  members.forEach((m) => {
    const label = ROLE_LABELS[m.role] || m.role;
    roleCounts[label] = (roleCounts[label] || 0) + 1;
  });
  const roleChartData = Object.entries(roleCounts)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  // Combined recent activity (loans + POs sorted by creation date)
  const recentActivity = [
    ...loans.slice(0, 10).map((l) => ({
      id: l.id,
      type: "loan" as const,
      title: `Pinjaman ${l.trackingNumber}`,
      amount: l.amount,
      status: l.status,
      statusLabel: LOAN_STATUS_LABELS[l.status] || l.status,
      date: l.createdAt,
    })),
    ...purchaseOrders.slice(0, 10).map((po) => ({
      id: po.id,
      type: "po" as const,
      title: `PO ${po.poNumber}`,
      amount: po.totalAmount || po.estimatedAmount || "0",
      status: po.status,
      statusLabel: PO_STATUS_LABELS[po.status] || po.status,
      date: po.createdAt,
    })),
  ]
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 8);

  const filteredMembers = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Status badge helper ─────────────────────────────────────────────────

  function getStatusBadgeClasses(status: string): string {
    if (["approved", "disbursed", "completed", "payment_received"].includes(status))
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (["rejected"].includes(status))
      return "bg-red-50 text-red-700 border border-red-200";
    if (["draft"].includes(status))
      return "bg-gray-100 text-gray-600 border border-gray-200";
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  function getRoleBadgeClasses(role: string): string {
    switch (role) {
      case "ketua":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "bendahara":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "sekertaris":
        return "bg-teal-50 text-teal-700 border border-teal-200";
      case "manager":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case "member":
        return "bg-gray-100 text-gray-600 border border-gray-200";
      default:
        return "bg-sky-50 text-sky-700 border border-sky-200";
    }
  }

  // ─── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout variant="pengurus" userName={userName} onLogout={handleLogout}>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Pengurus</h1>
          <p className="text-sm text-gray-500 mt-1">
            Selamat datang, {userName} &mdash;{" "}
            <span className="font-medium text-gray-700">
              {ROLE_LABELS[userRole] || userRole}
            </span>
          </p>
        </div>
        <label className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 cursor-pointer transition shadow-sm shadow-blue-200">
          <Upload className="w-4 h-4" />
          Upload Simpanan
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleUploadSavings}
            className="hidden"
          />
        </label>
      </div>

      {/* ─── Summary Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">Total Anggota</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{members.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {activeMembers.length} aktif &middot;{" "}
            {members.length - activeMembers.length} nonaktif
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm text-gray-500">Pinjaman Pending</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingLoans.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {loanApprovals.length} menunggu persetujuan Anda
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-500">PO Pending</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingPOs.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {poApprovals.length} menunggu persetujuan Anda
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Total Pinjaman</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalLoanAmount)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{loans.length} total pinjaman</p>
        </div>
      </div>

      {/* ─── Pending Approvals ─────────────────────────────────────────── */}
      {allPendingApprovals.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Menunggu Persetujuan
            </h2>
            <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {allPendingApprovals.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allPendingApprovals.map((approval) => {
              const isLoan = approval.referenceType === "loan";
              return (
                <div
                  key={approval.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isLoan ? "bg-amber-100" : "bg-purple-100"
                      }`}
                    >
                      {isLoan ? (
                        <CreditCard className="w-5 h-5 text-amber-600" />
                      ) : (
                        <ShoppingCart className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isLoan
                              ? "bg-amber-100 text-amber-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {isLoan ? "Pinjaman" : "Purchase Order"}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {isLoan ? "Pinjaman" : "PO"} #{approval.referenceId.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Step {approval.stepOrder} &mdash;{" "}
                        {approval.stepLabel || ROLE_LABELS[approval.approverRole]}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleApproval(approval.id, "approve")}
                      disabled={actionLoading === approval.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Setujui
                    </button>
                    <button
                      onClick={() =>
                        handleApproval(approval.id, "reject", "Ditolak oleh pengurus")
                      }
                      disabled={actionLoading === approval.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-white text-red-600 border border-red-200 px-3 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Tolak
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Loan Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Tren Pinjaman Bulanan</h2>
            </div>
            <span className="text-xs text-gray-400">6 bulan terakhir</span>
          </div>
          <div className="p-5">
            {loanBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={loanBarData} barCategoryGap="20%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      v >= 1_000_000
                        ? `${(v / 1_000_000).toFixed(0)}jt`
                        : `${(v / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Pinjaman"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
                    }}
                  />
                  <Bar dataKey="amount" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
                Belum ada data pinjaman
              </div>
            )}
          </div>
        </div>

        {/* Role Distribution Pie */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Distribusi Role</h2>
          </div>
          <div className="p-5">
            {roleChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={roleChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {roleChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {roleChartData.slice(0, 5).map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              PIE_COLORS[index % PIE_COLORS.length],
                          }}
                        />
                        <span className="text-gray-600 text-xs">{item.name}</span>
                      </div>
                      <span className="font-medium text-gray-900 text-xs">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
                Belum ada data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Recent Activity Table ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Aktivitas Terbaru</h2>
          </div>
          <span className="text-xs text-gray-400">
            {recentActivity.length} item terakhir
          </span>
        </div>
        <div className="p-5">
          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Belum ada aktivitas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                    <th className="pb-3 font-medium">Tipe</th>
                    <th className="pb-3 font-medium">Referensi</th>
                    <th className="pb-3 font-medium">Tanggal</th>
                    <th className="pb-3 font-medium text-right">Jumlah</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((item) => (
                    <tr
                      key={`${item.type}-${item.id}`}
                      className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              item.type === "loan"
                                ? "bg-amber-100"
                                : "bg-purple-100"
                            }`}
                          >
                            {item.type === "loan" ? (
                              <CreditCard className="w-4 h-4 text-amber-600" />
                            ) : (
                              <ShoppingCart className="w-4 h-4 text-purple-600" />
                            )}
                          </div>
                          <span className="font-medium text-gray-700 text-xs uppercase tracking-wide">
                            {item.type === "loan" ? "Pinjaman" : "PO"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <p className="font-medium text-gray-900">{item.title}</p>
                      </td>
                      <td className="py-3.5 text-gray-500">
                        {new Date(item.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 text-right font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${getStatusBadgeClasses(
                            item.status
                          )}`}
                        >
                          {item.statusLabel}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        {/* PO status flow action buttons */}
                        {item.type === "po" && (
                          <div className="flex gap-1 justify-center flex-wrap">
                            {item.status === "approved_rab" && (
                              <button
                                onClick={() =>
                                  handleUpdatePoStatus(item.id, "spp_process")
                                }
                                className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition"
                              >
                                Proses SPP
                              </button>
                            )}
                            {item.status === "spp_process" && (
                              <button
                                onClick={() =>
                                  handleUpdatePoStatus(item.id, "procurement")
                                }
                                className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition"
                              >
                                Beli Vendor
                              </button>
                            )}
                            {item.status === "procurement" && (
                              <button
                                onClick={() =>
                                  handleUpdatePoStatus(item.id, "delivery")
                                }
                                className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition"
                              >
                                Kirim Vendor
                              </button>
                            )}
                            {item.status === "delivery" && (
                              <button
                                onClick={() =>
                                  handleUpdatePoStatus(item.id, "goods_received")
                                }
                                className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition"
                              >
                                Diterima
                              </button>
                            )}
                            {item.status === "goods_received" && (
                              <button
                                onClick={() =>
                                  handleUpdatePoStatus(item.id, "goods_delivered")
                                }
                                className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition"
                              >
                                Kirim Client
                              </button>
                            )}
                            {item.status === "goods_delivered" && (
                              <button
                                onClick={() =>
                                  handleUpdatePoStatus(item.id, "invoicing")
                                }
                                className="text-xs bg-orange-500 text-white px-2.5 py-1 rounded-lg hover:bg-orange-600 transition"
                              >
                                Invoice
                              </button>
                            )}
                            {item.status === "invoicing" && (
                              <button
                                onClick={() =>
                                  handleUpdatePoStatus(item.id, "waiting_payment")
                                }
                                className="text-xs bg-orange-500 text-white px-2.5 py-1 rounded-lg hover:bg-orange-600 transition"
                              >
                                Kirim Invoice
                              </button>
                            )}
                            {item.status === "waiting_payment" && (
                              <button
                                onClick={() =>
                                  handleUpdatePoStatus(item.id, "payment_received")
                                }
                                className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition"
                              >
                                Bayar Diterima
                              </button>
                            )}
                            {item.status === "payment_received" && (
                              <button
                                onClick={() =>
                                  handleUpdatePoStatus(item.id, "completed")
                                }
                                className="text-xs bg-gray-800 text-white px-2.5 py-1 rounded-lg hover:bg-gray-900 transition"
                              >
                                Selesai
                              </button>
                            )}
                          </div>
                        )}
                        {item.type === "loan" && (
                          <span className="text-xs text-gray-400">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── Members Section ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Daftar Anggota</h2>
            <span className="text-xs text-gray-400 ml-1">
              ({members.length} total)
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[#f4f7fe] rounded-xl px-3 py-2 border border-gray-100 w-full sm:w-[280px]">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari anggota..."
              className="bg-transparent text-sm outline-none flex-1 text-gray-600 placeholder:text-gray-400"
            />
          </div>
        </div>
        <div className="p-5">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                {searchTerm
                  ? "Tidak ditemukan anggota yang cocok."
                  : "Belum ada anggota."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                    <th className="pb-3 font-medium">Anggota</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Departemen</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.slice(0, 10).map((member) => (
                    <tr
                      key={member.id}
                      className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.fullName}
                            </p>
                            <p className="text-xs text-gray-400">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${getRoleBadgeClasses(
                            member.role
                          )}`}
                        >
                          {ROLE_LABELS[member.role] || member.role}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-600">
                        {member.department || "-"}
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${
                            member.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          {member.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateUser(member.id, {
                                role: e.target.value,
                              } as Partial<User>)
                            }
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          >
                            {Object.entries(ROLE_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() =>
                              handleUpdateUser(member.id, {
                                isActive: !member.isActive,
                              })
                            }
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                              member.isActive
                                ? "text-red-600 bg-red-50 hover:bg-red-100 border border-red-200"
                                : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                          >
                            {member.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMembers.length > 10 && (
                <div className="pt-4 border-t border-gray-100 mt-2 text-center">
                  <p className="text-xs text-gray-400">
                    Menampilkan 10 dari {filteredMembers.length} anggota.{" "}
                    <a
                      href="/pengurus/members"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Lihat semua
                      <ChevronRight className="w-3 h-3 inline ml-0.5" />
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
