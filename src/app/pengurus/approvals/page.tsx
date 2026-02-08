"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { ROLE_LABELS } from "@/lib/utils";
import { CheckSquare, CreditCard, ShoppingCart, Check, X, FileText } from "lucide-react";

interface Approval {
  id: string;
  referenceType: string;
  referenceId: string;
  approverRole: string;
  action?: string;
  stepOrder: number;
  stepLabel?: string;
}

type FilterTab = "all" | "loan" | "purchase_order";

export default function PengurusApprovalsPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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

      const res = await fetch("/api/approvals?view=all");
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.approvals || []);
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

  async function handleApproval(
    approvalId: string,
    action: "approve" | "reject"
  ) {
    setActionLoading(approvalId);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalId,
          action,
          comments: action === "reject" ? "Ditolak oleh pengurus" : undefined,
        }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error("Approval action failed:", error);
    } finally {
      setActionLoading(null);
    }
  }

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
          <p className="text-gray-400 text-sm">Tidak ada persetujuan yang menunggu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredApprovals.map((approval) => {
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
                      {isLoan ? "Pinjaman" : "PO"} #{approval.referenceId.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Step {approval.stepOrder} &mdash;{" "}
                      {approval.stepLabel || ROLE_LABELS[approval.approverRole]}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Approver:{" "}
                      <span className="font-medium text-gray-600">
                        {ROLE_LABELS[approval.approverRole] || approval.approverRole}
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
                    onClick={() => handleApproval(approval.id, "reject")}
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
      )}
    </DashboardLayout>
  );
}
