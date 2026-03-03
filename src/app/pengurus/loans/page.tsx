"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import {
  formatCurrency,
  LOAN_TYPE_LABELS,
  LOAN_STATUS_LABELS,
} from "@/lib/utils";
import { CreditCard, Wallet, TrendingUp, FileText, Loader2, ArrowRight, FileDown, PauseCircle, PlayCircle, Hash, Settings2, Save, Lock } from "lucide-react";
import Link from "next/link";

interface LoanQuota {
  id: string;
  period: string;
  loanType: string;
  quotaAmount: string;
  usedAmount: string;
}

interface CrossQuotaInfo {
  regulerQuota: number;
  khususQuota: number;
  regulerUsed: number;
  khususUsed: number;
  combinedQuota: number;
  combinedUsed: number;
  combinedRemaining: number;
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
  queueNumber: number | null;
  queuePeriod: string | null;
  holdReason: string | null;
}

type LoanFilter = "all" | "reguler" | "khusus" | "barang" | "travel" | "channeling";

export default function PengurusLoansPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [userRole, setUserRole] = useState("");
  const [filter, setFilter] = useState<LoanFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [quotas, setQuotas] = useState<LoanQuota[]>([]);
  const [crossQuota, setCrossQuota] = useState<CrossQuotaInfo | null>(null);
  const [canSetQuota, setCanSetQuota] = useState(false);
  const [showQuotaPanel, setShowQuotaPanel] = useState(false);
  const [quotaEdits, setQuotaEdits] = useState<Record<string, string>>({});
  const [savingQuota, setSavingQuota] = useState<string | null>(null);
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

      const [loanRes, quotaRes] = await Promise.all([
        fetch("/api/loans?view=all"),
        fetch(`/api/loan-quotas?period=${getCurrentPeriod()}`),
      ]);

      if (loanRes.ok) {
        const data = await loanRes.json();
        setLoans(data.loans || []);
      }
      if (quotaRes.ok) {
        const data = await quotaRes.json();
        setQuotas(data.quotas || []);
        setCrossQuota(data.crossQuota || null);
        setCanSetQuota(data.canSetQuota || false);
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

  function getCurrentPeriod() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/pengurus/login");
  }

  async function saveQuota(loanType: string) {
    const value = quotaEdits[loanType];
    if (!value || isNaN(parseFloat(value))) return;

    setSavingQuota(loanType);
    try {
      const res = await fetch("/api/loan-quotas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period: getCurrentPeriod(),
          loanType,
          quotaAmount: parseFloat(value),
        }),
      });
      if (res.ok) {
        const quotaRes = await fetch(`/api/loan-quotas?period=${getCurrentPeriod()}`);
        if (quotaRes.ok) {
          const data = await quotaRes.json();
          setQuotas(data.quotas || []);
        }
        setQuotaEdits((prev) => {
          const next = { ...prev };
          delete next[loanType];
          return next;
        });
      }
    } catch {
      alert("Gagal menyimpan kuota");
    } finally {
      setSavingQuota(null);
    }
  }

  async function updateLoanStatus(loanId: string, newStatus: string, extra?: Record<string, string>) {
    setUpdatingId(loanId);
    try {
      const res = await fetch(`/api/loans/${loanId}/status`, {
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

  function getNextAction(status: string): { label: string; nextStatus: string; needsInput?: string; requiredRole: string; icon?: string } | null {
    switch (status) {
      case "spp_process": return { label: "Buat SPP", nextStatus: "", needsInput: "spp", requiredRole: "staf_treasury" };
      case "bank_process": return { label: "Dana Dicairkan", nextStatus: "disbursed", requiredRole: "staf_treasury" };
      case "held": return { label: "Proses Ulang", nextStatus: "pending_treasury", requiredRole: "staf_treasury", icon: "resume" };
      default: return null;
    }
  }

  function getStatusBadgeClasses(status: string): string {
    if (["approved", "disbursed", "selesai"].includes(status))
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (["rejected"].includes(status))
      return "bg-red-50 text-red-700 border border-red-200";
    if (["held"].includes(status))
      return "bg-orange-50 text-orange-700 border border-orange-200";
    if (["draft"].includes(status))
      return "bg-gray-100 text-gray-600 border border-gray-200";
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  function canDownloadForm(loan: Loan): boolean {
    return loan.loanType !== "channeling" && loan.loanType !== "travel";
  }

  const filteredLoans = (filter === "all" ? loans : loans.filter((l) => l.loanType === filter))
    .sort((a, b) => {
      // Pending loans sorted by queue number first
      const aPending = a.status.startsWith("pending_") || a.status === "held";
      const bPending = b.status.startsWith("pending_") || b.status === "held";
      if (aPending && bPending) {
        // Sort by period then queue number
        if (a.queuePeriod && b.queuePeriod) {
          if (a.queuePeriod !== b.queuePeriod) return a.queuePeriod.localeCompare(b.queuePeriod);
        }
        return (a.queueNumber || 999) - (b.queueNumber || 999);
      }
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalLoans = loans.length;
  const activeLoans = loans.filter(
    (l) => !["rejected", "draft"].includes(l.status)
  ).length;
  const totalAmount = loans.reduce(
    (sum, l) => sum + parseFloat(l.amount || "0"),
    0
  );

  const filterOptions: { key: LoanFilter; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "reguler", label: "Reguler" },
    { key: "khusus", label: "Khusus" },
    { key: "barang", label: "Barang" },
    { key: "travel", label: "Travel" },
    { key: "channeling", label: "Channeling" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat data pinjaman...</p>
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
            <CreditCard className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Pinjaman</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Kelola semua data pinjaman anggota koperasi
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Total Pinjaman
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalLoans}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Pinjaman Aktif
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeLoans}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Total Nilai Pinjaman
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalAmount)}
          </p>
        </div>
      </div>

      {/* Quota Management Toggle */}
      {["staf_treasury", "manager", "bendahara", "ketua"].includes(userRole) && (
        <div className="mb-6">
          <button
            onClick={() => setShowQuotaPanel(!showQuotaPanel)}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-teal-600 transition"
          >
            <Settings2 className="w-4 h-4" />
            Kuota Pinjaman Bulan Ini ({getCurrentPeriod()})
            <span className={`transition-transform ${showQuotaPanel ? "rotate-180" : ""}`}>&#9660;</span>
          </button>

          {showQuotaPanel && (
            <div className="mt-3 bg-white rounded-2xl shadow-sm p-5">
              <p className="text-xs text-gray-500 mb-4">
                Kuota pinjaman dalam Rupiah per bulan. Pinjaman Reguler (Rp 50 Jt) dan Khusus (Rp 70 Jt) berbagi kuota gabungan.
                {!canSetQuota && (
                  <span className="block mt-1 text-orange-500">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Hanya Manager, Bendahara, atau Ketua yang dapat mengubah kuota.
                  </span>
                )}
              </p>

              {/* Cross-quota info banner for Reguler + Khusus */}
              {crossQuota && (
                <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 mb-2">Kuota Gabungan Reguler + Khusus</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-600">
                      {formatCurrency(crossQuota.combinedUsed)} / {formatCurrency(crossQuota.combinedQuota)}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      crossQuota.combinedRemaining <= 0
                        ? "bg-red-50 text-red-600"
                        : "bg-green-50 text-green-600"
                    }`}>
                      Sisa: {formatCurrency(Math.max(0, crossQuota.combinedRemaining))}
                    </span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        crossQuota.combinedRemaining <= 0 ? "bg-red-400" : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min((crossQuota.combinedUsed / crossQuota.combinedQuota) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-blue-500 mt-2">
                    Reguler: {formatCurrency(crossQuota.regulerUsed)} terpakai | Khusus: {formatCurrency(crossQuota.khususUsed)} terpakai
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(["reguler", "khusus", "barang", "travel", "channeling"] as const).map((type) => {
                  const existing = quotas.find((q) => q.loanType === type);
                  const DEFAULT_AMOUNTS: Record<string, number> = { reguler: 50_000_000, khusus: 70_000_000 };
                  const currentQuotaAmt = existing ? parseFloat(existing.quotaAmount) : (DEFAULT_AMOUNTS[type] || 0);
                  const usedAmt = existing ? parseFloat(existing.usedAmount) : 0;
                  const editValue = quotaEdits[type];
                  const isEditing = editValue !== undefined;
                  const pct = currentQuotaAmt > 0 ? (usedAmt / currentQuotaAmt) * 100 : 0;
                  const isRegOrKhusus = type === "reguler" || type === "khusus";

                  return (
                    <div key={type} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {LOAN_TYPE_LABELS[type] || type}
                        </span>
                        {isRegOrKhusus && (
                          <span className="text-[9px] text-blue-400 px-1.5 py-0.5 bg-blue-50 rounded-full">Berbagi</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Terpakai</span>
                        <span className={`text-xs font-medium ${
                          usedAmt >= currentQuotaAmt && currentQuotaAmt > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}>
                          {formatCurrency(usedAmt)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            pct >= 100 ? "bg-red-400" : "bg-teal-400"
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-gray-400">Kuota</span>
                        <span className="text-xs font-semibold text-gray-700">{formatCurrency(currentQuotaAmt)}</span>
                      </div>
                      {canSetQuota ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="1000000"
                            value={isEditing ? editValue : currentQuotaAmt}
                            onChange={(e) => setQuotaEdits((prev) => ({ ...prev, [type]: e.target.value }))}
                            className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-teal-300 outline-none"
                          />
                          {isEditing && (
                            <button
                              onClick={() => saveQuota(type)}
                              disabled={savingQuota === type}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition disabled:opacity-50"
                            >
                              {savingQuota === type ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                              Simpan
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-400 italic">Hanya bisa dilihat</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm mb-6 w-fit">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              filter === opt.key
                ? "bg-teal-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-5">
          {filteredLoans.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                {filter !== "all"
                  ? "Tidak ada pinjaman untuk jenis ini."
                  : "Belum ada data pinjaman."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                    <th className="pb-3 font-medium text-center">No. Urut</th>
                    <th className="pb-3 font-medium">Tracking</th>
                    <th className="pb-3 font-medium">Jenis</th>
                    <th className="pb-3 font-medium text-right">Jumlah</th>
                    <th className="pb-3 font-medium text-center">Tenor</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium">Periode</th>
                    <th className="pb-3 font-medium text-center">Formulir</th>
                    <th className="pb-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((loan) => (
                    <tr
                      key={loan.id}
                      className={`border-t border-gray-50 hover:bg-gray-50/50 transition-colors ${loan.status === "held" ? "bg-orange-50/30" : ""}`}
                    >
                      <td className="py-3.5 text-center">
                        {loan.queueNumber ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                            <Hash className="w-3 h-3" />
                            {loan.queueNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded-md">
                          {loan.trackingNumber}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="text-sm font-medium text-gray-900">
                          {LOAN_TYPE_LABELS[loan.loanType] || loan.loanType}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-semibold text-gray-900">
                        {formatCurrency(loan.amount)}
                      </td>
                      <td className="py-3.5 text-center text-gray-500">
                        {loan.tenorMonths} bulan
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-medium ${getStatusBadgeClasses(loan.status)}`}
                        >
                          {LOAN_STATUS_LABELS[loan.status] || loan.status}
                        </span>
                        {loan.status === "held" && loan.holdReason && (
                          <p className="text-[10px] text-orange-500 mt-0.5">{loan.holdReason}</p>
                        )}
                      </td>
                      <td className="py-3.5 text-gray-500 text-xs">
                        {loan.queuePeriod || new Date(loan.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 text-center">
                        {canDownloadForm(loan) ? (
                          <Link
                            href={`/pengurus/loans/${loan.id}/print`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            PDF
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        {(() => {
                          const action = getNextAction(loan.status);
                          if (!action) return <span className="text-xs text-gray-300">—</span>;
                          if (userRole !== action.requiredRole) {
                            return <span className="text-[10px] text-gray-400 italic">Menunggu {action.requiredRole.replace("staf_", "Staf ")}</span>;
                          }
                          if (action.needsInput === "spp") {
                            return (
                              <button
                                onClick={() => router.push(`/pengurus/spp/create?type=loan&ref=${loan.id}`)}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium transition"
                              >
                                <FileText className="w-3 h-3" /> Buat SPP
                              </button>
                            );
                          }
                          return (
                            <button
                              onClick={() => updateLoanStatus(loan.id, action.nextStatus)}
                              disabled={updatingId === loan.id}
                              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition disabled:opacity-50 ${
                                action.icon === "resume"
                                  ? "bg-green-50 text-green-600 hover:bg-green-100"
                                  : "bg-teal-50 text-teal-600 hover:bg-teal-100"
                              }`}
                            >
                              {updatingId === loan.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : action.icon === "resume" ? (
                                <PlayCircle className="w-3 h-3" />
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
              {filteredLoans.length > 0 && (
                <div className="pt-4 border-t border-gray-100 mt-2">
                  <p className="text-xs text-gray-400">
                    Menampilkan {filteredLoans.length} dari {loans.length} pinjaman.
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
