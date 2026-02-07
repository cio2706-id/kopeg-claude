"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import {
  formatCurrency,
  ROLE_LABELS,
  PO_STATUS_LABELS,
  LOAN_STATUS_LABELS,
  LOAN_TYPE_LABELS,
} from "@/lib/utils";
import {
  Users,
  CreditCard,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  FileText,
  Upload,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  createdAt: string;
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

type ActivityTab = "all" | "loan" | "po";

// ─── Component ──────────────────────────────────────────────────────────────

export default function PengurusDashboardPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activityTab, setActivityTab] = useState<ActivityTab>("all");
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
      setUserEmail(user.email || "");
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

  // ─── Derived data ─────────────────────────────────────────────────────────

  const loanApprovals = pendingApprovals.filter(
    (a) => a.referenceType === "loan" && !a.action
  );
  const poApprovals = pendingApprovals.filter(
    (a) => a.referenceType === "purchase_order" && !a.action
  );
  const allPendingApprovals = [...loanApprovals, ...poApprovals];

  const activeMembers = members.filter((m) => m.isActive);

  const pendingLoans = loans.filter(
    (l) => !["approved", "disbursed", "rejected", "draft"].includes(l.status)
  );

  const pendingPOs = purchaseOrders.filter(
    (po) => !["completed", "rejected"].includes(po.status)
  );

  const totalLoanAmount = loans.reduce(
    (sum, l) => sum + parseFloat(l.amount || "0"),
    0
  );

  // Pencairan bulan ini: loans disbursed this month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const disbursedThisMonth = loans.filter((l) => {
    if (l.status !== "disbursed") return false;
    const d = new Date(l.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalDisbursedThisMonth = disbursedThisMonth.reduce(
    (sum, l) => sum + parseFloat(l.amount || "0"),
    0
  );

  // Combined recent activity (loans + POs sorted by date)
  const allActivity = [
    ...loans.map((l) => ({
      id: l.id,
      type: "loan" as const,
      description: LOAN_TYPE_LABELS[l.loanType] || l.loanType,
      tracking: l.trackingNumber,
      amount: l.amount,
      status: l.status,
      statusLabel: LOAN_STATUS_LABELS[l.status] || l.status,
      date: l.createdAt,
    })),
    ...purchaseOrders.map((po) => ({
      id: po.id,
      type: "po" as const,
      description: po.description,
      tracking: po.trackingNumber || po.poNumber,
      amount: po.totalAmount || po.estimatedAmount || "0",
      status: po.status,
      statusLabel: PO_STATUS_LABELS[po.status] || po.status,
      date: po.createdAt,
    })),
  ].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredActivity =
    activityTab === "all"
      ? allActivity
      : allActivity.filter((a) => a.type === activityTab);

  // Loan trend bar chart: last 6 months
  const loanByMonth: Record<string, number> = {};
  loans.forEach((loan) => {
    const date = new Date(loan.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    loanByMonth[key] = (loanByMonth[key] || 0) + parseFloat(loan.amount || "0");
  });
  const loanBarData = Object.entries(loanByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([period, amount]) => ({
      period: period.split("-").reverse().join("/"),
      amount,
    }));

  // Role distribution counts
  const roleCounts: Record<string, number> = {};
  members.forEach((m) => {
    const label = ROLE_LABELS[m.role] || m.role;
    roleCounts[label] = (roleCounts[label] || 0) + 1;
  });

  // Recent members (sorted by creation, most recent first)
  const recentMembers = [...members]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 5);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function getStatusBadgeClasses(status: string): string {
    if (
      ["approved", "disbursed", "completed", "payment_received"].includes(
        status
      )
    )
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

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout
      variant="pengurus"
      userName={userName}
      userEmail={userEmail}
      onLogout={handleLogout}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Pengurus
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Selamat datang, {userName} &mdash;{" "}
            <span className="font-medium text-teal-600">
              {ROLE_LABELS[userRole] || userRole}
            </span>
          </p>
        </div>
        <label className="inline-flex items-center gap-2 bg-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-600 cursor-pointer transition shadow-sm shadow-teal-200">
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

      {/* ─── 5 Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* 1. Total Anggota */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Total Anggota
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{members.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {activeMembers.length} aktif
          </p>
        </div>

        {/* 2. Pinjaman Pending */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Pinjaman Pending
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {pendingLoans.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {loanApprovals.length} menunggu Anda
          </p>
        </div>

        {/* 3. PO Pending */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              PO Pending
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {pendingPOs.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {poApprovals.length} menunggu Anda
          </p>
        </div>

        {/* 4. Total Simpanan Anggota */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Total Pinjaman
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalLoanAmount)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {loans.length} pinjaman
          </p>
        </div>

        {/* 5. Pencairan Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Pencairan Bulan Ini
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalDisbursedThisMonth)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {disbursedThisMonth.length} pencairan
          </p>
        </div>
      </div>

      {/* ─── Pending Approvals ────────────────────────────────────────────── */}
      {allPendingApprovals.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Menunggu Persetujuan
            </h2>
            <span className="bg-red-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              {allPendingApprovals.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allPendingApprovals.map((approval) => {
              const isLoan = approval.referenceType === "loan";
              return (
                <div
                  key={approval.id}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isLoan ? "bg-teal-100" : "bg-gray-100"
                      }`}
                    >
                      {isLoan ? (
                        <CreditCard className="w-5 h-5 text-teal-600" />
                      ) : (
                        <ShoppingCart className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isLoan
                            ? "bg-teal-50 text-teal-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {isLoan ? "Pinjaman" : "Purchase Order"}
                      </span>
                      <p className="font-semibold text-gray-900 text-sm mt-2 truncate">
                        {isLoan ? "Pinjaman" : "PO"} #
                        {approval.referenceId.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Step {approval.stepOrder} &mdash;{" "}
                        {approval.stepLabel ||
                          ROLE_LABELS[approval.approverRole]}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Approver:{" "}
                        <span className="font-medium text-gray-600">
                          {ROLE_LABELS[approval.approverRole] ||
                            approval.approverRole}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleApproval(approval.id, "approve")}
                      disabled={actionLoading === approval.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-teal-500 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-teal-600 transition disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Setujui
                    </button>
                    <button
                      onClick={() =>
                        handleApproval(
                          approval.id,
                          "reject",
                          "Ditolak oleh pengurus"
                        )
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

      {/* ─── Loan Trend Chart ─────────────────────────────────────────────── */}
      {loanBarData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-500" />
              <h2 className="font-semibold text-gray-900">
                Tren Pinjaman Bulanan
              </h2>
            </div>
            <span className="text-xs text-gray-400">6 bulan terakhir</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
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
                formatter={(value) => [
                  formatCurrency(Number(value)),
                  "Pinjaman",
                ]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
                }}
              />
              <Bar dataKey="amount" fill="#14b8a6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ─── Recent Activity Table ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm mb-8">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Aktivitas Terbaru</h2>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(
              [
                { key: "all", label: "Semua" },
                { key: "loan", label: "Pinjaman" },
                { key: "po", label: "Purchase Order" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActivityTab(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  activityTab === tab.key
                    ? "bg-white text-teal-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5">
          {filteredActivity.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Belum ada aktivitas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                    <th className="pb-3 font-medium">Deskripsi</th>
                    <th className="pb-3 font-medium">ID / Tracking</th>
                    <th className="pb-3 font-medium">Tipe</th>
                    <th className="pb-3 font-medium">Tanggal</th>
                    <th className="pb-3 font-medium text-right">Jumlah</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivity.slice(0, 10).map((item) => (
                    <tr
                      key={`${item.type}-${item.id}`}
                      className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3.5">
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">
                          {item.description}
                        </p>
                      </td>
                      <td className="py-3.5">
                        <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                          {item.tracking}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              item.type === "loan"
                                ? "bg-teal-100"
                                : "bg-gray-100"
                            }`}
                          >
                            {item.type === "loan" ? (
                              <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                            ) : (
                              <ShoppingCart className="w-3.5 h-3.5 text-gray-500" />
                            )}
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {item.type === "loan" ? "Pinjaman" : "PO"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-gray-500 text-xs">
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
                          className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-medium ${getStatusBadgeClasses(
                            item.status
                          )}`}
                        >
                          {item.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredActivity.length > 10 && (
                <div className="pt-4 border-t border-gray-100 mt-2 text-center">
                  <p className="text-xs text-gray-400">
                    Menampilkan 10 dari {filteredActivity.length} aktivitas.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Anggota Overview ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Ringkasan Anggota</h2>
            <Link
              href="/pengurus/members"
              className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5"
            >
              Lihat Semua <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Total & Active */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-teal-50 rounded-xl p-3.5 text-center">
              <p className="text-2xl font-bold text-teal-700">
                {activeMembers.length}
              </p>
              <p className="text-[11px] text-teal-600 font-medium mt-0.5">
                Aktif
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3.5 text-center">
              <p className="text-2xl font-bold text-gray-700">
                {members.length - activeMembers.length}
              </p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                Nonaktif
              </p>
            </div>
          </div>

          {/* Role Breakdown */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Per Role
          </p>
          <div className="space-y-2">
            {Object.entries(roleCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([role, count]) => (
                <div
                  key={role}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600 text-xs">{role}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-400 rounded-full"
                        style={{
                          width: `${Math.min(
                            (count / members.length) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 text-xs w-6 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Members Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Anggota Terbaru</h2>
            </div>
            <Link
              href="/pengurus/members"
              className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5"
            >
              Kelola <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5">
            {recentMembers.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Belum ada anggota.</p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {recentMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                              {member.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {member.fullName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-medium ${getRoleBadgeClasses(
                              member.role
                            )}`}
                          >
                            {ROLE_LABELS[member.role] || member.role}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-gray-500">
                          {member.department || "-"}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${
                              member.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {member.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
