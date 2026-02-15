"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency, ROLE_LABELS } from "@/lib/utils";
import {
  FileText,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Loader2,
  CreditCard,
  ShoppingCart,
} from "lucide-react";

interface SppRecord {
  id: string;
  sppNumber: string;
  referenceType: string | null;
  referenceId: string | null;
  requestDate: string;
  payableTo: string;
  totalAmount: string;
  status: string;
  createdBy: string;
  createdAt: string;
  creatorName: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: <Clock className="w-3.5 h-3.5" /> },
  pending_manager: { label: "Menunggu Manager", color: "bg-amber-50 text-amber-700", icon: <Clock className="w-3.5 h-3.5" /> },
  pending_bendahara: { label: "Menunggu Bendahara", color: "bg-blue-50 text-blue-700", icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { label: "Disetujui", color: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: "Ditolak", color: "bg-red-50 text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function SppListPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sppList, setSppList] = useState<SppRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/pengurus/login"); return; }
      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Pengurus");
      setUserEmail(user.email || "");

      const res = await fetch("/api/spp");
      if (res.ok) {
        const data = await res.json();
        setSppList(data.spp || []);
      }
    } catch (error) {
      console.error("Failed to load SPP:", error);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/pengurus/login");
  }

  const filtered = sppList.filter((s) => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.sppNumber.toLowerCase().includes(q) ||
      s.payableTo.toLowerCase().includes(q) ||
      (s.creatorName || "").toLowerCase().includes(q)
    );
  });

  const statusCounts = {
    all: sppList.length,
    draft: sppList.filter((s) => s.status === "draft").length,
    pending_manager: sppList.filter((s) => s.status === "pending_manager").length,
    pending_bendahara: sppList.filter((s) => s.status === "pending_bendahara").length,
    approved: sppList.filter((s) => s.status === "approved").length,
    rejected: sppList.filter((s) => s.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat data SPP...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout variant="pengurus" userName={userName} userEmail={userEmail} onLogout={handleLogout}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Surat Permintaan Pembayaran</h1>
            <p className="text-sm text-gray-500 mt-0.5">{sppList.length} SPP terdaftar</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/pengurus/spp/create")}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-600 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Buat SPP Baru
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: "all", label: "Semua" },
          { key: "draft", label: "Draft" },
          { key: "pending_manager", label: "Menunggu Manager" },
          { key: "pending_bendahara", label: "Menunggu Bendahara" },
          { key: "approved", label: "Disetujui" },
          { key: "rejected", label: "Ditolak" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              filterStatus === tab.key
                ? "bg-teal-500 text-white"
                : "bg-white text-gray-500 hover:bg-gray-100"
            }`}
          >
            {tab.label} ({statusCounts[tab.key as keyof typeof statusCounts] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari no. SPP, penerima, atau pembuat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1 text-gray-600 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* SPP List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {searchQuery || filterStatus !== "all" ? "Tidak ada SPP yang cocok." : "Belum ada SPP."}
            </p>
          </div>
        ) : (
          filtered.map((s) => {
            const sc = STATUS_CONFIG[s.status] || STATUS_CONFIG.draft;
            return (
              <button
                key={s.id}
                onClick={() => router.push(`/pengurus/spp/${s.id}`)}
                className="w-full bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-900 text-sm">{s.sppNumber}</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </span>
                      {s.referenceType && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                          {s.referenceType === "loan" ? <CreditCard className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
                          {s.referenceType === "loan" ? "Pinjaman" : "PO"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Kepada: <span className="text-gray-700 font-medium">{s.payableTo}</span></span>
                      <span>Oleh: {s.creatorName}</span>
                      <span>{new Date(s.requestDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="font-bold text-gray-900">{formatCurrency(Number(s.totalAmount))}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
