"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { ROLE_LABELS, LOAN_TYPE_LABELS, LOAN_STATUS_LABELS, formatCurrency } from "@/lib/utils";
import { CheckSquare, CreditCard, ShoppingCart, Check, X, FileText, ChevronDown, ChevronUp, User, Clock, AlertCircle, Download, Eye, Edit3 } from "lucide-react";
import { PO_STATUS_LABELS } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Approval {
  id: string;
  referenceType: string;
  referenceId: string;
  approverRole: string;
  action?: string | null;
  stepOrder: number;
  stepLabel?: string | null;
  comments?: string | null;
  decidedAt?: string | null;
  createdAt?: string;
}

interface ApprovalStep {
  id: string;
  stepOrder: number;
  stepLabel: string | null;
  approverRole: string;
  action: string | null;
  comments: string | null;
  decidedAt: string | null;
  createdAt: string;
  approver: {
    id: string;
    fullName: string | null;
    email: string | null;
  } | null;
}

interface Requester {
  fullName: string | null;
  email: string | null;
  department: string | null;
  employeeId: string | null;
}

interface LoanData {
  id: string;
  loanType: string;
  amount: string;
  interestRate: string;
  tenorMonths: number;
  monthlyInstallment: string;
  purpose: string | null;
  status: string;
  trackingNumber: string;
  creditScore: string | null;
  createdAt: string;
  documentUrls?: string[] | null;
  formData?: Record<string, unknown> | null;
}

interface LoanDetail {
  loan: LoanData;
  requester: Requester;
  activeLoans: LoanData[];
  pendingRequests: LoanData[];
  approvalSteps: ApprovalStep[];
  loanBalances?: { loanType: string; saldo: string }[];
}

interface PoItemData {
  id: string;
  itemName: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: string;
  totalPrice: string;
}

interface PoData {
  id: string;
  trackingNumber: string;
  poNumber: string;
  description: string;
  status: string;
  estimatedAmount: string | null;
  totalAmount: string | null;
  requesterName: string | null;
  requesterDivisi: string | null;
  requesterNip: string | null;
  vendorName: string | null;
  documentUrls: string[] | null;
  adjustmentNotes: string | null;
  createdAt: string;
}

interface PoDetail {
  purchaseOrder: PoData;
  items: PoItemData[];
}

type FilterTab = "all" | "loan" | "purchase_order";

// ─── Component ──────────────────────────────────────────────────────────────

export default function PengurusApprovalsPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [loanDetails, setLoanDetails] = useState<Record<string, LoanDetail>>({});
  const [loanDetailLoading, setLoanDetailLoading] = useState<Record<string, boolean>>({});
  const [poDetails, setPoDetails] = useState<Record<string, PoDetail>>({});
  const [poDetailLoading, setPoDetailLoading] = useState<Record<string, boolean>>({});
  const [userDbRole, setUserDbRole] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [managerNewPrice, setManagerNewPrice] = useState<Record<string, string>>({});
  const [managerPriceNotes, setManagerPriceNotes] = useState<Record<string, string>>({});
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  // ─── Data Loading ───────────────────────────────────────────────────────

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

      // Fetch approvals and users in parallel
      const [approvalsRes, usersRes] = await Promise.all([
        fetch("/api/approvals?view=all"),
        fetch("/api/users"),
      ]);

      if (approvalsRes.ok) {
        const data = await approvalsRes.json();
        setApprovals(data.approvals || []);
      }

      // Find current user's DB role
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const me = (usersData.users || []).find(
          (u: any) => u.email === user.email
        );
        if (me) setUserDbRole(me.role);
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

  // ─── Loan Detail Fetching ───────────────────────────────────────────────

  const fetchLoanDetail = useCallback(async (referenceId: string) => {
    if (loanDetails[referenceId] || loanDetailLoading[referenceId]) return;

    setLoanDetailLoading((prev) => ({ ...prev, [referenceId]: true }));
    try {
      const res = await fetch(`/api/loans/${referenceId}`);
      if (res.ok) {
        const data = await res.json();
        setLoanDetails((prev) => ({ ...prev, [referenceId]: data }));
      }
    } catch (error) {
      console.error("Failed to fetch loan detail:", error);
    } finally {
      setLoanDetailLoading((prev) => ({ ...prev, [referenceId]: false }));
    }
  }, [loanDetails, loanDetailLoading]);

  // ─── PO Detail Fetching ─────────────────────────────────────────────────

  const fetchPoDetail = useCallback(async (referenceId: string) => {
    if (poDetails[referenceId] || poDetailLoading[referenceId]) return;

    setPoDetailLoading((prev) => ({ ...prev, [referenceId]: true }));
    try {
      const res = await fetch(`/api/purchase-orders/${referenceId}`);
      if (res.ok) {
        const data = await res.json();
        setPoDetails((prev) => ({ ...prev, [referenceId]: data }));
      }
    } catch (error) {
      console.error("Failed to fetch PO detail:", error);
    } finally {
      setPoDetailLoading((prev) => ({ ...prev, [referenceId]: false }));
    }
  }, [poDetails, poDetailLoading]);

  // ─── Card Expansion ────────────────────────────────────────────────────

  function handleCardClick(approval: Approval) {
    if (selectedApprovalId === approval.id) {
      setSelectedApprovalId(null);
      setRejectingId(null);
      setRejectReason("");
      return;
    }

    setSelectedApprovalId(approval.id);
    setRejectingId(null);
    setRejectReason("");

    // Fetch detail when expanding
    if (approval.referenceType === "loan") {
      fetchLoanDetail(approval.referenceId);
    } else if (approval.referenceType === "purchase_order") {
      fetchPoDetail(approval.referenceId);
    }
  }

  // ─── Actions ────────────────────────────────────────────────────────────

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/pengurus/login");
  }

  async function handleApprove(approvalId: string, extra?: { totalAmount?: number; adjustmentNotes?: string }) {
    setActionLoading(approvalId);
    try {
      const body: Record<string, unknown> = { approvalId, action: "approve" };
      if (extra?.totalAmount) body.totalAmount = extra.totalAmount;
      if (extra?.adjustmentNotes) body.adjustmentNotes = extra.adjustmentNotes;

      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSelectedApprovalId(null);
        // Clear cached details so they refresh
        setLoanDetails({});
        setPoDetails({});
        loadData();
      }
    } catch (error) {
      console.error("Approval action failed:", error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(approvalId: string) {
    if (!rejectReason.trim()) return;

    setActionLoading(approvalId);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalId,
          action: "reject",
          comments: rejectReason.trim(),
        }),
      });
      if (res.ok) {
        setSelectedApprovalId(null);
        setRejectingId(null);
        setRejectReason("");
        setLoanDetails({});
        loadData();
      }
    } catch (error) {
      console.error("Rejection failed:", error);
    } finally {
      setActionLoading(null);
    }
  }

  // ─── Derived Data ──────────────────────────────────────────────────────

  const pendingApprovals = approvals.filter((a) => !a.action);

  const filteredApprovals =
    activeTab === "all"
      ? pendingApprovals
      : pendingApprovals.filter((a) => a.referenceType === activeTab);

  const loanCount = pendingApprovals.filter(
    (a) => a.referenceType === "loan"
  ).length;
  const poCount = pendingApprovals.filter(
    (a) => a.referenceType === "purchase_order"
  ).length;

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: pendingApprovals.length },
    { key: "loan", label: "Pinjaman", count: loanCount },
    { key: "purchase_order", label: "Purchase Order", count: poCount },
  ];

  // ─── Render Helpers ────────────────────────────────────────────────────

  function renderApprovalTimeline(steps: ApprovalStep[]) {
    return (
      <div className="mt-5 pt-5 border-t border-gray-100">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Timeline Persetujuan
        </h4>
        <div className="space-y-0">
          {steps.map((step, index) => {
            const isApproved = step.action === "approve";
            const isRejected = step.action === "reject";
            const isPending = !step.action;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="flex gap-3">
                {/* Timeline line and dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isApproved
                        ? "bg-teal-100"
                        : isRejected
                        ? "bg-red-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {isApproved ? (
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                    ) : isRejected ? (
                      <X className="w-3.5 h-3.5 text-red-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 h-8 ${
                        isApproved
                          ? "bg-teal-200"
                          : isRejected
                          ? "bg-red-200"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>

                {/* Step info */}
                <div className={`pb-4 ${isLast ? "" : ""}`}>
                  <p className="text-sm font-medium text-gray-900">
                    Step {step.stepOrder} &mdash;{" "}
                    {ROLE_LABELS[step.approverRole] || step.approverRole}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {step.stepLabel || "Persetujuan"}
                  </p>
                  {isApproved && (
                    <p className="text-xs text-teal-600 mt-1 font-medium">
                      Disetujui
                      {step.approver?.fullName
                        ? ` oleh ${step.approver.fullName}`
                        : ""}
                    </p>
                  )}
                  {isRejected && (
                    <div className="mt-1">
                      <p className="text-xs text-red-600 font-medium">
                        Ditolak
                        {step.approver?.fullName
                          ? ` oleh ${step.approver.fullName}`
                          : ""}
                      </p>
                      {step.comments && (
                        <p className="text-xs text-red-500 mt-0.5 italic">
                          &quot;{step.comments}&quot;
                        </p>
                      )}
                    </div>
                  )}
                  {isPending && (
                    <p className="text-xs text-gray-400 mt-1">
                      Menunggu persetujuan
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderLoanExpandedDetail(approval: Approval) {
    const detail = loanDetails[approval.referenceId];
    const isLoading = loanDetailLoading[approval.referenceId];

    if (isLoading) {
      return (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" />
            <p className="text-xs text-gray-400">Memuat detail pinjaman...</p>
          </div>
        </div>
      );
    }

    if (!detail) {
      return (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center py-6">
          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Gagal memuat detail pinjaman.</p>
        </div>
      );
    }

    const { loan, requester, activeLoans, pendingRequests, approvalSteps, loanBalances: importedBalances } = detail;
    const activeLoansTotal = activeLoans.reduce(
      (sum, l) => sum + parseFloat(l.amount),
      0
    );

    // Calculate imported loan balance total
    const importedBalanceTotal = (importedBalances || []).reduce(
      (sum, lb) => sum + parseFloat(lb.saldo || "0"),
      0
    );

    const canAct = userDbRole === approval.approverRole;
    const isRejecting = rejectingId === approval.id;

    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        {/* Loan Detail */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Jenis Pinjaman
            </p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">
              {LOAN_TYPE_LABELS[loan.loanType] || loan.loanType}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Jumlah
            </p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              {formatCurrency(Number(loan.amount))}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Tenor
            </p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">
              {loan.tenorMonths} bulan
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Angsuran/Bulan
            </p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">
              {formatCurrency(Number(loan.monthlyInstallment))}
            </p>
          </div>
          {loan.purpose && (
            <div className="col-span-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Tujuan
              </p>
              <p className="text-sm text-gray-700 mt-0.5">{loan.purpose}</p>
            </div>
          )}
        </div>

        {/* Dokumen Pendukung */}
        {loan.documentUrls && loan.documentUrls.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Dokumen Pendukung
            </h4>
            <div className="space-y-2">
              {loan.documentUrls.map((url, idx) => {
                const fileName = url.split("/").pop() || `Dokumen ${idx + 1}`;
                const isImage = /\.(jpg|jpeg|png|webp)$/i.test(url);
                return (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 flex-1 truncate">{fileName}</span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 px-2 py-1 rounded-lg hover:bg-teal-50 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Lihat
                    </a>
                    <a
                      href={url}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Requester Info */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Informasi Pemohon
          </h4>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Nama</span>
              <span className="text-xs font-medium text-gray-900">
                {requester?.fullName || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Departemen</span>
              <span className="text-xs font-medium text-gray-900">
                {requester?.department || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">NIP</span>
              <span className="text-xs font-medium text-gray-900">
                {requester?.employeeId || "-"}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
              <span className="text-xs text-gray-500">
                Saldo Pinjaman (Data Impor)
              </span>
              <span className="text-xs font-medium text-gray-900">
                {importedBalanceTotal > 0
                  ? formatCurrency(importedBalanceTotal)
                  : "Tidak ada data"}
              </span>
            </div>
            {importedBalances && importedBalances.length > 0 && (
              <div className="pl-3 space-y-1">
                {importedBalances.filter(lb => parseFloat(lb.saldo || "0") > 0).map((lb, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-[11px] text-gray-400 capitalize">
                      {lb.loanType.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {formatCurrency(parseFloat(lb.saldo || "0"))}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">
                Pinjaman aktif (app)
              </span>
              <span className="text-xs font-medium text-gray-900">
                {activeLoans.length} pinjaman
                {activeLoans.length > 0 && (
                  <span className="text-gray-400 ml-1">
                    ({formatCurrency(activeLoansTotal)})
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">
                Pengajuan pending lainnya
              </span>
              <span className="text-xs font-medium text-gray-900">
                {pendingRequests.length} pengajuan
              </span>
            </div>
          </div>
        </div>

        {/* Approval Timeline */}
        {approvalSteps.length > 0 && renderApprovalTimeline(approvalSteps)}

        {/* Action Buttons */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          {canAct ? (
            <div className="space-y-3">
              {!isRejecting && (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(approval.id);
                    }}
                    disabled={actionLoading === approval.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-600 transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Setujui
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRejectingId(approval.id);
                      setRejectReason("");
                    }}
                    disabled={actionLoading === approval.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Tolak
                  </button>
                </div>
              )}

              {isRejecting && (
                <div className="bg-red-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-red-700">
                    Alasan Penolakan
                  </p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Tuliskan alasan penolakan..."
                    rows={3}
                    className="w-full text-sm border border-red-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none bg-white text-gray-900 placeholder:text-gray-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(approval.id);
                      }}
                      disabled={
                        actionLoading === approval.id ||
                        !rejectReason.trim()
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Konfirmasi Tolak
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-3 rounded-xl">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">
                Menunggu{" "}
                <span className="font-semibold">
                  {ROLE_LABELS[approval.approverRole] || approval.approverRole}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderPOExpandedDetail(approval: Approval) {
    const detail = poDetails[approval.referenceId];
    const isLoading = poDetailLoading[approval.referenceId];
    const canAct = userDbRole === approval.approverRole;
    const isRejecting = rejectingId === approval.id;
    const isManagerStep = approval.approverRole === "manager";

    if (isLoading) {
      return (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" />
            <p className="text-xs text-gray-400">Memuat detail PO...</p>
          </div>
        </div>
      );
    }

    if (!detail) {
      return (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center py-6">
          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Gagal memuat detail PO.</p>
        </div>
      );
    }

    const { purchaseOrder: po, items } = detail;
    const itemsTotal = items.reduce((sum, item) => sum + parseFloat(item.totalPrice || "0"), 0);

    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        {/* PO Header Info */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Nomor PO</p>
            <p className="text-sm font-mono font-medium text-gray-900 mt-0.5">{po.poNumber}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{PO_STATUS_LABELS[po.status] || po.status}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Deskripsi</p>
            <p className="text-sm text-gray-700 mt-0.5">{po.description}</p>
          </div>
          {po.estimatedAmount && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Estimasi</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(Number(po.estimatedAmount))}</p>
            </div>
          )}
          {po.totalAmount && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total RAB</p>
              <p className="text-sm font-bold text-teal-600 mt-0.5">{formatCurrency(Number(po.totalAmount))}</p>
            </div>
          )}
        </div>

        {/* Requester Info */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Identitas Pemohon
          </h4>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Nama</span>
              <span className="text-xs font-medium text-gray-900">{po.requesterName || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Divisi</span>
              <span className="text-xs font-medium text-gray-900">{po.requesterDivisi || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">NIP</span>
              <span className="text-xs font-medium text-gray-900">{po.requesterNip || "-"}</span>
            </div>
          </div>
        </div>

        {/* Item Details */}
        {items.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Detail Barang ({items.length} item)
            </h4>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.itemName}</p>
                      {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {item.quantity} {item.unit || "pcs"} x {formatCurrency(Number(item.unitPrice))}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{formatCurrency(Number(item.totalPrice))}</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-semibold text-gray-500">TOTAL ITEM</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(itemsTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Document Files */}
        {po.documentUrls && po.documentUrls.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Dokumen Pendukung
            </h4>
            <div className="space-y-2">
              {po.documentUrls.map((url, idx) => {
                const fileName = url.split("/").pop() || `Dokumen ${idx + 1}`;
                return (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 flex-1 truncate">{fileName}</span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 px-2 py-1 rounded-lg hover:bg-teal-50 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Lihat
                    </a>
                    <a
                      href={url}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Manager Price Edit */}
        {canAct && isManagerStep && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5" />
              Penyesuaian Harga (Opsional)
            </h4>
            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
              <p className="text-xs text-blue-700">
                Anda dapat menyesuaikan total harga sebelum menyetujui. Harga lama akan tersimpan sebagai estimasi.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Harga Baru (Rp)</label>
                <input
                  type="number"
                  value={managerNewPrice[approval.id] || ""}
                  onChange={(e) => {
                    e.stopPropagation();
                    setManagerNewPrice((prev) => ({ ...prev, [approval.id]: e.target.value }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={po.totalAmount ? Number(po.totalAmount).toString() : po.estimatedAmount ? Number(po.estimatedAmount).toString() : "0"}
                  min="0"
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Catatan Penyesuaian</label>
                <input
                  type="text"
                  value={managerPriceNotes[approval.id] || ""}
                  onChange={(e) => {
                    e.stopPropagation();
                    setManagerPriceNotes((prev) => ({ ...prev, [approval.id]: e.target.value }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Alasan perubahan harga (opsional)"
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          {canAct ? (
            <div className="space-y-3">
              {!isRejecting && (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newPrice = managerNewPrice[approval.id] ? parseFloat(managerNewPrice[approval.id]) : undefined;
                      const notes = managerPriceNotes[approval.id] || undefined;
                      handleApprove(approval.id, isManagerStep && newPrice ? { totalAmount: newPrice, adjustmentNotes: notes } : undefined);
                    }}
                    disabled={actionLoading === approval.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-600 transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Setujui
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRejectingId(approval.id);
                      setRejectReason("");
                    }}
                    disabled={actionLoading === approval.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Tolak
                  </button>
                </div>
              )}

              {isRejecting && (
                <div className="bg-red-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-red-700">
                    Alasan Penolakan
                  </p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Tuliskan alasan penolakan..."
                    rows={3}
                    className="w-full text-sm border border-red-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none bg-white text-gray-900 placeholder:text-gray-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(approval.id);
                      }}
                      disabled={
                        actionLoading === approval.id ||
                        !rejectReason.trim()
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Konfirmasi Tolak
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-3 rounded-xl">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">
                Menunggu{" "}
                <span className="font-semibold">
                  {ROLE_LABELS[approval.approverRole] || approval.approverRole}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Loading State ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat data persetujuan...</p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────

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
            <CheckSquare className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Persetujuan</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {pendingApprovals.length} persetujuan menunggu tindakan
            </p>
          </div>
        </div>
        {userDbRole && (
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm">
            <User className="w-4 h-4 text-teal-500" />
            <span className="text-sm text-gray-600">Role Anda:</span>
            <span className="text-sm font-semibold text-gray-900">
              {ROLE_LABELS[userDbRole] || userDbRole}
            </span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === tab.key
                ? "bg-teal-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-2 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Approval Cards */}
      {filteredApprovals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            Tidak ada persetujuan yang menunggu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApprovals.map((approval) => {
            const isLoan = approval.referenceType === "loan";
            const isExpanded = selectedApprovalId === approval.id;
            const detail = loanDetails[approval.referenceId];
            const poDetail = poDetails[approval.referenceId];
            const canAct = userDbRole === approval.approverRole;

            return (
              <div
                key={approval.id}
                onClick={() => handleCardClick(approval)}
                className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  isExpanded ? "ring-2 ring-teal-200" : ""
                }`}
              >
                {/* Collapsed Header - Always Visible */}
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
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

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isLoan
                              ? "bg-teal-50 text-teal-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {isLoan ? "Pinjaman" : "Purchase Order"}
                        </span>
                        {isLoan && detail?.loan && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-600">
                            {LOAN_TYPE_LABELS[detail.loan.loanType] ||
                              detail.loan.loanType}
                          </span>
                        )}
                        {canAct && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                            Perlu Tindakan
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {isLoan ? "Pinjaman" : "PO"} #
                          {isLoan
                            ? approval.referenceId.slice(0, 8)
                            : poDetail?.purchaseOrder?.poNumber || approval.referenceId.slice(0, 8)}
                        </p>
                        {isLoan && detail?.loan && (
                          <p className="text-sm font-bold text-teal-600">
                            {formatCurrency(Number(detail.loan.amount))}
                          </p>
                        )}
                        {!isLoan && poDetail?.purchaseOrder && (
                          <p className="text-sm font-bold text-gray-700">
                            {formatCurrency(Number(poDetail.purchaseOrder.totalAmount || poDetail.purchaseOrder.estimatedAmount || 0))}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Step {approval.stepOrder} &mdash;{" "}
                        {ROLE_LABELS[approval.approverRole] ||
                          approval.approverRole}
                      </p>
                      {isLoan && detail?.requester?.fullName && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Pemohon:{" "}
                          <span className="font-medium text-gray-700">
                            {detail.requester.fullName}
                          </span>
                        </p>
                      )}
                      {!isLoan && poDetail?.purchaseOrder?.requesterName && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Pemohon:{" "}
                          <span className="font-medium text-gray-700">
                            {poDetail.purchaseOrder.requesterName}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Expand Arrow */}
                    <div className="flex-shrink-0 text-gray-400">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-5 pb-5">
                    {isLoan
                      ? renderLoanExpandedDetail(approval)
                      : renderPOExpandedDetail(approval)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
