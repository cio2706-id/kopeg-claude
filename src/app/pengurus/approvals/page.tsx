"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { ROLE_LABELS, LOAN_TYPE_LABELS, LOAN_STATUS_LABELS, formatCurrency } from "@/lib/utils";
import { CheckSquare, CreditCard, ShoppingCart, Check, X, FileText, ChevronDown, ChevronUp, User, Clock, AlertCircle, Download, Eye, Edit3, PauseCircle } from "lucide-react";
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
  queueNumber?: number | null;
  queuePeriod?: string | null;
  holdReason?: string | null;
}

interface LoanDetail {
  loan: LoanData;
  requester: Requester;
  activeLoans: LoanData[];
  pendingRequests: LoanData[];
  approvalSteps: ApprovalStep[];
  loanBalances?: { loanType: string; saldo: string }[];
  estimatedSaldoInstallment?: number;
  installmentSource?: string;
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
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" /></div>}>
      <PengurusApprovalsContent />
    </Suspense>
  );
}

function PengurusApprovalsContent() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as FilterTab) || "all";
  const [activeTab, setActiveTab] = useState<FilterTab>(initialTab);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [loanDetails, setLoanDetails] = useState<Record<string, LoanDetail>>({});
  const [loanDetailLoading, setLoanDetailLoading] = useState<Record<string, boolean>>({});
  const [poDetails, setPoDetails] = useState<Record<string, PoDetail>>({});
  const [poDetailLoading, setPoDetailLoading] = useState<Record<string, boolean>>({});
  const [userDbRole, setUserDbRole] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [holdingId, setHoldingId] = useState<string | null>(null);
  const [holdReason, setHoldReason] = useState("");
  const [managerNewPrice, setManagerNewPrice] = useState<Record<string, string>>({});
  const [managerPriceNotes, setManagerPriceNotes] = useState<Record<string, string>>({});
  const [managerLoanPrice, setManagerLoanPrice] = useState<Record<string, string>>({});
  const [quotaData, setQuotaData] = useState<{ quotas: any[]; crossQuota: any } | null>(null);
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
        if (me) {
          setUserDbRole(me.role);
          // Fetch quota data for Bendahara
          if (me.role === "bendahara") {
            const now = new Date();
            const currentPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
            try {
              const quotaRes = await fetch(`/api/loan-quotas?period=${currentPeriod}`);
              if (quotaRes.ok) {
                const qData = await quotaRes.json();
                setQuotaData(qData);
              }
            } catch {
              // Silently ignore quota fetch errors
            }
          }
        }
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

  async function handleApprove(approvalId: string, extra?: { totalAmount?: number; adjustmentNotes?: string; loanAmount?: number }) {
    setActionLoading(approvalId);
    try {
      const body: Record<string, unknown> = { approvalId, action: "approve" };
      if (extra?.totalAmount) body.totalAmount = extra.totalAmount;
      if (extra?.adjustmentNotes) body.adjustmentNotes = extra.adjustmentNotes;
      if (extra?.loanAmount) body.loanAmount = extra.loanAmount;

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

  async function handleHold(approvalId: string) {
    setActionLoading(approvalId);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalId,
          action: "hold",
          comments: holdReason.trim() || "Ditunda ke bulan berikutnya",
        }),
      });
      if (res.ok) {
        setSelectedApprovalId(null);
        setHoldingId(null);
        setHoldReason("");
        setLoanDetails({});
        loadData();
      }
    } catch (error) {
      console.error("Hold action failed:", error);
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

    const { loan, requester, activeLoans, pendingRequests, approvalSteps, loanBalances: importedBalances, estimatedSaldoInstallment, installmentSource } = detail;
    const activeLoansTotal = activeLoans.reduce(
      (sum, l) => sum + parseFloat(l.amount),
      0
    );
    const activeLoansMonthlyTotal = activeLoans.reduce(
      (sum, l) => sum + parseFloat(l.monthlyInstallment),
      0
    );

    // Calculate imported loan balance total
    const importedBalanceTotal = (importedBalances || []).reduce(
      (sum, lb) => sum + parseFloat(lb.saldo || "0"),
      0
    );

    // Combined total saldo (imported + active disbursed loans)
    const totalSaldoPinjaman = importedBalanceTotal + activeLoansTotal;

    // Total existing monthly installment (active app loans + estimated saldo loans)
    const totalExistingInstallment = activeLoansMonthlyTotal + (estimatedSaldoInstallment || 0);
    // Include the new loan request installment
    const newLoanInstallment = parseFloat(loan.monthlyInstallment);
    const totalCicilanWithNew = totalExistingInstallment + newLoanInstallment;
    // Get penghasilan bruto from formData if available
    const penghasilanBruto = loan.formData ? Number((loan.formData as Record<string, unknown>).penghasilanBruto || 0) : 0;
    const maxAllowedCicilan = penghasilanBruto * 0.4;
    const cicilanExceeds40 = penghasilanBruto > 0 && totalCicilanWithNew > maxAllowedCicilan;

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
              <span className="text-xs font-semibold text-gray-700">
                Total Saldo Pinjaman
              </span>
              <span className="text-xs font-bold text-gray-900">
                {totalSaldoPinjaman > 0
                  ? formatCurrency(totalSaldoPinjaman)
                  : "Tidak ada data"}
              </span>
            </div>
            {(importedBalanceTotal > 0 || activeLoans.length > 0) && (
              <div className="pl-3 space-y-1">
                {importedBalances && importedBalances.filter(lb => parseFloat(lb.saldo || "0") > 0).map((lb, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-[11px] text-gray-400 capitalize">
                      {lb.loanType.replace(/_/g, " ")} (kertas kerja)
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {formatCurrency(parseFloat(lb.saldo || "0"))}
                    </span>
                  </div>
                ))}
                {activeLoans.map((al, idx) => (
                  <div key={`al-${idx}`} className="flex justify-between">
                    <span className="text-[11px] text-gray-400 capitalize">
                      {(LOAN_TYPE_LABELS[al.loanType] || al.loanType)} (dicairkan)
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {formatCurrency(parseFloat(al.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">
                Pinjaman Aktif (dicairkan)
              </span>
              <span className="text-xs font-medium text-gray-900">
                {activeLoans.length} pinjaman
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

            {/* Estimated Installment & 40% Check */}
            <div className="border-t border-gray-200 pt-2 mt-2 space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Analisa Cicilan (40% Pendapatan)</p>
              {totalExistingInstallment > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">
                    Cicilan pinjaman existing
                    {installmentSource === "potongan" ? " (potongan gaji)" : installmentSource === "excel_angsuran" ? " (angsuran Excel)" : " (est.)"}
                  </span>
                  <span className="text-xs font-medium text-gray-900">{formatCurrency(totalExistingInstallment)}/bln</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Cicilan pengajuan ini</span>
                <span className="text-xs font-medium text-gray-900">{formatCurrency(newLoanInstallment)}/bln</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-xs text-gray-700">Total cicilan</span>
                <span className="text-xs text-gray-900">{formatCurrency(totalCicilanWithNew)}/bln</span>
              </div>
              {penghasilanBruto > 0 ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Pendapatan bruto</span>
                    <span className="text-xs font-medium text-gray-900">{formatCurrency(penghasilanBruto)}/bln</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Maks 40% pendapatan</span>
                    <span className="text-xs font-medium text-gray-900">{formatCurrency(maxAllowedCicilan)}/bln</span>
                  </div>
                  <div className={`mt-1 px-3 py-2 rounded-lg text-xs font-medium ${
                    cicilanExceeds40
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}>
                    {cicilanExceeds40
                      ? `Melebihi batas 40%: ${formatCurrency(totalCicilanWithNew)} > ${formatCurrency(maxAllowedCicilan)}`
                      : `Dalam batas 40%: ${formatCurrency(totalCicilanWithNew)} / ${formatCurrency(maxAllowedCicilan)}`
                    }
                  </div>
                </>
              ) : (
                <div className="mt-1 px-3 py-2 rounded-lg text-xs bg-yellow-50 text-yellow-700 border border-yellow-200">
                  Pendapatan bruto tidak tersedia - tidak dapat menghitung rasio 40%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Approval Timeline */}
        {approvalSteps.length > 0 && renderApprovalTimeline(approvalSteps)}

        {/* Manager Price Input for Item Loans (barang/travel/kendaraan) */}
        {canAct && userDbRole === "manager" && ["barang", "travel", "kepemilikan_kendaraan"].includes(loan.loanType) && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5" />
              Tentukan Harga Pinjaman
            </h4>
            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
              <p className="text-xs text-blue-700">
                Masukkan jumlah pinjaman yang disetujui. Angsuran akan dihitung ulang otomatis.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah Pinjaman (Rp) *</label>
                <input
                  type="number"
                  value={managerLoanPrice[approval.id] || ""}
                  onChange={(e) => {
                    e.stopPropagation();
                    setManagerLoanPrice((prev) => ({ ...prev, [approval.id]: e.target.value }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={Number(loan.amount).toString()}
                  min="0"
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white"
                />
                <p className="text-xs text-gray-400 mt-1">Harga saat ini: {formatCurrency(Number(loan.amount))}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quota Info for Bendahara */}
        {userDbRole === "bendahara" && quotaData?.crossQuota && (() => {
          const cq = quotaData.crossQuota;
          const regulerPct = cq.regulerQuota > 0 ? Math.round((cq.regulerUsed / cq.regulerQuota) * 100) : 0;
          const khususPct = cq.khususQuota > 0 ? Math.round((cq.khususUsed / cq.khususQuota) * 100) : 0;
          const combinedPct = cq.combinedQuota > 0 ? Math.round((cq.combinedUsed / cq.combinedQuota) * 100) : 0;
          const loanAmount = Number(loan.amount);
          const afterApproval = cq.combinedUsed + loanAmount;
          const afterPct = cq.combinedQuota > 0 ? Math.round((afterApproval / cq.combinedQuota) * 100) : 0;
          const wouldExceed = afterApproval > cq.combinedQuota;
          const isQuotaType = ["reguler", "khusus"].includes(loan.loanType);

          return (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Kuota Pinjaman Bulan Ini
            </h4>

            {/* Reguler & Khusus side by side */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Reguler */}
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Reguler</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${regulerPct >= 100 ? 'bg-red-100 text-red-700' : regulerPct >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {regulerPct}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${regulerPct >= 100 ? 'bg-red-500' : regulerPct >= 80 ? 'bg-amber-500' : 'bg-teal-500'}`}
                    style={{ width: `${Math.min(regulerPct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Terpakai</span>
                  <span className="font-medium text-slate-700">{formatCurrency(cq.regulerUsed)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Kuota</span>
                  <span className="font-medium text-slate-700">{formatCurrency(cq.regulerQuota)}</span>
                </div>
                <div className="flex justify-between text-[10px] mt-0.5">
                  <span className="text-slate-400">Sisa</span>
                  <span className={`font-semibold ${cq.regulerQuota - cq.regulerUsed < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatCurrency(cq.regulerQuota - cq.regulerUsed)}
                  </span>
                </div>
              </div>

              {/* Khusus */}
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Khusus</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${khususPct >= 100 ? 'bg-red-100 text-red-700' : khususPct >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {khususPct}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${khususPct >= 100 ? 'bg-red-500' : khususPct >= 80 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.min(khususPct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Terpakai</span>
                  <span className="font-medium text-slate-700">{formatCurrency(cq.khususUsed)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Kuota</span>
                  <span className="font-medium text-slate-700">{formatCurrency(cq.khususQuota)}</span>
                </div>
                <div className="flex justify-between text-[10px] mt-0.5">
                  <span className="text-slate-400">Sisa</span>
                  <span className={`font-semibold ${cq.khususQuota - cq.khususUsed < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatCurrency(cq.khususQuota - cq.khususUsed)}
                  </span>
                </div>
              </div>
            </div>

            {/* Combined Quota */}
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-800">Kuota Gabungan</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${combinedPct >= 100 ? 'bg-red-100 text-red-700' : combinedPct >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {combinedPct}% terpakai
                </span>
              </div>

              {/* Combined progress bar */}
              <div className="relative w-full bg-blue-200 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full transition-all ${combinedPct >= 100 ? 'bg-red-500' : combinedPct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(combinedPct, 100)}%` }}
                />
                {/* Show projected bar if this loan would increase usage */}
                {isQuotaType && afterPct > combinedPct && (
                  <div
                    className={`absolute top-0 h-3 rounded-r-full transition-all ${wouldExceed ? 'bg-red-300' : 'bg-blue-300'}`}
                    style={{
                      left: `${Math.min(combinedPct, 100)}%`,
                      width: `${Math.min(afterPct - combinedPct, 100 - Math.min(combinedPct, 100))}%`,
                    }}
                  />
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-blue-500 font-medium">Total Kuota</p>
                  <p className="text-xs font-bold text-blue-900">{formatCurrency(cq.combinedQuota)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-500 font-medium">Dicairkan</p>
                  <p className="text-xs font-bold text-blue-900">{formatCurrency(cq.combinedUsed)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-500 font-medium">Sisa</p>
                  <p className={`text-xs font-bold ${cq.combinedRemaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatCurrency(cq.combinedRemaining)}
                  </p>
                </div>
              </div>

              {/* Impact of approving this loan */}
              {isQuotaType && (
                <div className={`mt-3 pt-3 border-t ${wouldExceed ? 'border-red-200' : 'border-blue-200'}`}>
                  <div className={`flex items-start gap-2 rounded-lg p-2.5 ${wouldExceed ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${wouldExceed ? 'text-red-500' : 'text-emerald-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-semibold ${wouldExceed ? 'text-red-700' : 'text-emerald-700'}`}>
                        {wouldExceed ? 'Melebihi Kuota!' : 'Dalam Kuota'}
                      </p>
                      <p className={`text-[10px] mt-0.5 ${wouldExceed ? 'text-red-600' : 'text-emerald-600'}`}>
                        Jika disetujui ({formatCurrency(loanAmount)}), total menjadi {formatCurrency(afterApproval)} dari {formatCurrency(cq.combinedQuota)} ({afterPct}%)
                      </p>
                      {wouldExceed && (
                        <p className="text-[10px] text-red-600 font-semibold mt-0.5">
                          Kelebihan: {formatCurrency(afterApproval - cq.combinedQuota)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          );
        })()}

        {/* Action Buttons */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          {canAct ? (
            <div className="space-y-3">
              {!isRejecting && holdingId !== approval.id && (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const isItemLoan = ["barang", "travel", "kepemilikan_kendaraan"].includes(loan.loanType);
                      const isManagerStep = userDbRole === "manager";
                      const loanPrice = managerLoanPrice[approval.id] ? parseFloat(managerLoanPrice[approval.id]) : undefined;

                      if (isItemLoan && isManagerStep && !loanPrice) {
                        alert("Silahkan masukkan jumlah pinjaman yang disetujui terlebih dahulu.");
                        return;
                      }

                      handleApprove(approval.id, isItemLoan && isManagerStep && loanPrice ? { loanAmount: loanPrice } : undefined);
                    }}
                    disabled={actionLoading === approval.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-600 transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Setujui
                  </button>
                  {approval.referenceType === "loan" && userDbRole === "bendahara" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHoldingId(approval.id);
                        setHoldReason("");
                      }}
                      disabled={actionLoading === approval.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-white text-orange-600 border border-orange-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-50 transition disabled:opacity-50"
                    >
                      <PauseCircle className="w-4 h-4" />
                      Tunda
                    </button>
                  )}
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

              {holdingId === approval.id && (
                <div className="bg-orange-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-orange-700">
                    Tunda ke Bulan Depan
                  </p>
                  <p className="text-xs text-orange-600">
                    Pinjaman akan ditunda dan mendapat nomor urut baru di bulan berikutnya.
                  </p>
                  <textarea
                    value={holdReason}
                    onChange={(e) => setHoldReason(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Alasan penundaan (opsional)..."
                    rows={2}
                    className="w-full text-sm border border-orange-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none bg-white text-gray-900 placeholder:text-gray-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHold(approval.id);
                      }}
                      disabled={actionLoading === approval.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-700 transition disabled:opacity-50"
                    >
                      <PauseCircle className="w-4 h-4" />
                      Konfirmasi Tunda
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHoldingId(null);
                        setHoldReason("");
                      }}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
                    >
                      Batal
                    </button>
                  </div>
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
                        {isLoan && detail?.loan?.queueNumber && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Urut #{detail.loan.queueNumber} &middot; {detail.loan.queuePeriod}
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
