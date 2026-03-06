"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Wallet,
  CreditCard,
  TrendingUp,
  Package,
  Plane,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  formatCurrency,
  LOAN_TYPE_LABELS,
  LOAN_STATUS_LABELS,
} from "@/lib/utils";
// recharts available if needed for future chart additions

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Saving {
  id: string;
  period: string;
  simpananPokok: string;
  simpananWajib: string;
  simpananKhusus: string;
  simpananSukarela: string;
  shu: string;
  totalBalance: string;
}

interface Loan {
  id: string;
  loanType: string;
  amount: string;
  status: string;
  trackingNumber: string;
  tenorMonths: number;
  monthlyInstallment: string;
  createdAt: string;
}

interface ImportedSimpanan {
  period: string;
  wajib: string;
  pokok: string;
  khusus: string;
  sukarela: string;
  shu: string;
  total: string;
}

interface ImportedPinjaman {
  byType: Record<string, number>;
  total: number;
}

/* ------------------------------------------------------------------ */
/*  COA map & loan-type metadata                                       */
/* ------------------------------------------------------------------ */

const LOAN_COA: Record<string, string> = {
  reguler: "110304",
  khusus: "110305",
  barang: "110306",
  travel: "110307",
  kepemilikan_kendaraan: "110308",
  channeling_mandiri: "-",
  channeling_bsi: "-",
};

const LOAN_MAX: Record<string, number> = {
  reguler: 50_000_000,
  khusus: 30_000_000,
  barang: 20_000_000,
  travel: 15_000_000,
  kepemilikan_kendaraan: 50_000_000,
  channeling_mandiri: 100_000_000,
  channeling_bsi: 100_000_000,
};

const LOAN_COLORS: Record<string, string> = {
  reguler: "#14b8a6",
  khusus: "#6366f1",
  barang: "#f59e0b",
  travel: "#ef4444",
  kepemilikan_kendaraan: "#0ea5e9",
  channeling_mandiri: "#3b82f6",
  channeling_bsi: "#8b5cf6",
};

const LOAN_TYPE_LABELS_EXTENDED: Record<string, string> = {
  reguler: "Pinjaman Reguler",
  khusus: "Pinjaman Khusus",
  barang: "Pinjaman Barang",
  travel: "Pinjaman Travel",
  kepemilikan_kendaraan: "Pinjaman Kendaraan",
  channeling_mandiri: "Channeling Mandiri",
  channeling_bsi: "Channeling BSI",
};

/* ------------------------------------------------------------------ */
/*  Semi-circle gauge component                                        */
/* ------------------------------------------------------------------ */

function SemiCircleGauge({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  // SVG semi-circle: stroke-dasharray trick
  const radius = 40;
  const circumference = Math.PI * radius; // half-circle
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="60" viewBox="0 0 100 60">
        {/* Background arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${offset}`}
          className="transition-all duration-700"
        />
        <text
          x="50"
          y="48"
          textAnchor="middle"
          className="text-xs font-bold"
          fill="#111827"
          fontSize="13"
        >
          {pct.toFixed(0)}%
        </text>
      </svg>
      <p className="text-xs text-gray-500 mt-1 text-center leading-tight">
        {label}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function MemberDashboardPage() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [importedSimpanan, setImportedSimpanan] = useState<ImportedSimpanan | null>(null);
  const [importedPinjaman, setImportedPinjaman] = useState<ImportedPinjaman | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  /* ---- data fetching ---- */

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/member/login");
      return;
    }
    setUserName(
      user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
    );
    setUserEmail(user.email || "");

    try {
      const [savingsRes, loansRes, memberBalancesRes] = await Promise.all([
        fetch("/api/savings"),
        fetch("/api/loans"),
        fetch("/api/member-balances"),
      ]);

      if (savingsRes.ok) {
        const data = await savingsRes.json();
        setSavings(data.savings || []);
      }
      if (loansRes.ok) {
        const data = await loansRes.json();
        setLoans(data.loans || []);
      }
      if (memberBalancesRes.ok) {
        const data = await memberBalancesRes.json();
        if (data.simpanan) setImportedSimpanan(data.simpanan);
        if (data.pinjaman) setImportedPinjaman(data.pinjaman);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/member/login");
  }

  /* ---- derived data ---- */

  const latestSaving = savings[0];
  // Prefer imported simpanan total if available
  const totalSavings = importedSimpanan
    ? parseFloat(importedSimpanan.total || "0")
    : latestSaving
    ? parseFloat(latestSaving.totalBalance)
    : 0;

  // Pinjaman balances from imported Excel data (loan_balances table)
  const mergedBalances: Record<string, number> = importedPinjaman
    ? { ...importedPinjaman.byType }
    : {};

  // All loan types with data (including channeling)
  const activeLoanTypes = Object.entries(mergedBalances)
    .filter(([, amount]) => amount > 0)
    .map(([type]) => type);
  // Show types that have data, plus standard 4 as fallback if no data at all
  const displayLoanTypes = activeLoanTypes.length > 0
    ? activeLoanTypes
    : ["reguler", "khusus", "barang", "channeling_mandiri", "channeling_bsi"];

  const recentLoans = [...loans]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  /* ---- loading state ---- */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  /* ---- card definitions ---- */

  const loanIcons: Record<string, React.ReactNode> = {
    reguler: <CreditCard className="w-5 h-5 text-teal-600" />,
    khusus: <TrendingUp className="w-5 h-5 text-indigo-600" />,
    barang: <Package className="w-5 h-5 text-amber-600" />,
    travel: <Plane className="w-5 h-5 text-red-600" />,
    channeling_mandiri: <CreditCard className="w-5 h-5 text-blue-600" />,
    channeling_bsi: <CreditCard className="w-5 h-5 text-purple-600" />,
  };

  const loanBgs: Record<string, string> = {
    reguler: "bg-teal-100",
    khusus: "bg-indigo-100",
    barang: "bg-amber-100",
    travel: "bg-red-100",
    channeling_mandiri: "bg-blue-100",
    channeling_bsi: "bg-purple-100",
  };

  const summaryCards: Array<{
    label: string;
    sub?: string;
    value: number;
    icon: React.ReactNode;
    bg: string;
  }> = [
    {
      label: "Simpanan",
      value: totalSavings,
      icon: <Wallet className="w-5 h-5 text-blue-600" />,
      bg: "bg-blue-100",
    },
    ...displayLoanTypes.map((type) => ({
      label: LOAN_TYPE_LABELS_EXTENDED[type] || type,
      sub: LOAN_COA[type] && LOAN_COA[type] !== "-" ? LOAN_COA[type] : undefined,
      value: mergedBalances[type] || 0,
      icon: loanIcons[type] || <CreditCard className="w-5 h-5 text-gray-600" />,
      bg: loanBgs[type] || "bg-gray-200",
    })),
  ];

  /* bottom pinjaman cards - all active loan types */
  const pinjamanCards = displayLoanTypes.map((type) => ({
    type,
    label: LOAN_TYPE_LABELS_EXTENDED[type] || type,
    coa: LOAN_COA[type] && LOAN_COA[type] !== "-" ? LOAN_COA[type] : undefined,
    amount: mergedBalances[type] || 0,
    color: LOAN_COLORS[type] || "#6b7280",
  }));

  /* ---- render ---- */

  return (
    <DashboardLayout
      variant="member"
      userName={userName}
      userEmail={userEmail}
      onLogout={handleLogout}
    >
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selamat datang kembali, {userName}
        </p>
      </div>

      {/* ============================================================ */}
      {/*  1. SUMMARY CARDS                                            */}
      {/* ============================================================ */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${summaryCards.length > 5 ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-5"} gap-4 mb-6`}>
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-3"
          >
            <div
              className={`w-11 h-11 rounded-full ${card.bg} flex items-center justify-center shrink-0`}
            >
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 leading-tight">{card.label}</p>
              {card.sub && (
                <p className="text-[10px] text-gray-400 font-mono">
                  COA {card.sub}
                </p>
              )}
              <p className="text-sm font-bold text-gray-900 mt-0.5 leading-tight whitespace-nowrap">
                {formatCurrency(card.value)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  2. MEMBER CARD  +  3. TRANSACTION HISTORY                   */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* --- Member Card --- */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#3b82f6] text-white p-7 shadow-lg min-h-[220px]">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute top-16 -right-6 w-28 h-28 bg-white/5 rounded-full" />
            <div className="absolute -bottom-12 -left-8 w-36 h-36 bg-white/5 rounded-full" />
            <div className="absolute bottom-6 right-24 w-16 h-16 bg-white/5 rounded-full" />

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <h2 className="text-sm font-bold tracking-wide">Kopeg BKI</h2>
                <p className="text-xs text-blue-200 mt-0.5 uppercase tracking-widest">
                  Anggota Koperasi
                </p>
              </div>

              <div className="mt-6">
                <p className="text-sm text-blue-200">Nama Anggota</p>
                <p className="text-base font-bold mt-0.5">{userName}</p>
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-xs text-blue-200">Saldo Simpanan</p>
                  <p className="text-lg font-bold mt-0.5">
                    {formatCurrency(totalSavings)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-200">Status</p>
                  <span className="inline-block bg-white/20 text-white text-xs px-3 py-1 rounded-full mt-1 font-medium">
                    Aktif
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Transaction History --- */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">
              Riwayat Transaksi
            </h2>
            <Link
              href="/member/loans"
              className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              Lihat Semua <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {recentLoans.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400 text-sm">Belum ada transaksi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="pb-2 font-medium">Jenis</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Tanggal</th>
                    <th className="pb-2 font-medium text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLoans.map((loan) => (
                    <tr
                      key={loan.id}
                      className="border-b border-gray-50 last:border-b-0"
                    >
                      <td className="py-2.5 text-gray-900 font-medium whitespace-nowrap">
                        {LOAN_TYPE_LABELS[loan.loanType]?.replace(
                          "Pinjaman ",
                          ""
                        ) || loan.loanType}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${
                            loan.status === "approved" ||
                            loan.status === "disbursed"
                              ? "bg-green-100 text-green-700"
                              : loan.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {LOAN_STATUS_LABELS[loan.status] || loan.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-500 whitespace-nowrap">
                        {new Date(loan.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(loan.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  4. SIMPANAN BREAKDOWN (imported data)                        */}
      {/* ============================================================ */}
      {importedSimpanan && (
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">
              Rincian Simpanan
            </h2>
            <p className="text-[10px] text-gray-400">
              Periode: {importedSimpanan.period}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Wajib", value: importedSimpanan.wajib },
              { label: "Pokok", value: importedSimpanan.pokok },
              { label: "Khusus", value: importedSimpanan.khusus },
              { label: "Sukarela", value: importedSimpanan.sukarela },
              { label: "SHU", value: importedSimpanan.shu },
              { label: "Total", value: importedSimpanan.total },
            ].map((item) => (
              <div key={item.label} className={`p-3 rounded-xl ${item.label === "Total" ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className={`text-sm font-bold mt-1 ${item.label === "Total" ? "text-blue-700" : "text-gray-900"}`}>
                  {formatCurrency(parseFloat(item.value || "0"))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  5. PINJAMAN CARDS  +  6. STATISTIK PINJAMAN                 */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- Pinjaman cards --- */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-4">
              Pinjaman
            </h2>
            <div className="space-y-3">
              {pinjamanCards.map((card) => (
                <div
                  key={card.type}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${card.color}20` }}
                  >
                    <FileText
                      className="w-5 h-5"
                      style={{ color: card.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {card.label}
                    </p>
                    {card.coa && (
                      <p className="text-[10px] text-gray-400 font-mono">
                        COA {card.coa}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                    {formatCurrency(card.amount)}
                  </p>
                </div>
              ))}

              <Link
                href="/member/loan-application"
                className="block w-full text-center text-sm font-medium text-teal-600 hover:text-teal-700 py-2 mt-2 rounded-lg hover:bg-teal-50 transition"
              >
                Ajukan Pinjaman Baru
              </Link>
            </div>
          </div>
        </div>

        {/* --- Statistik Pinjaman (semi-circle gauges) --- */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900 text-sm">
                Statistik Pinjaman
              </h2>
              <p className="text-[10px] text-gray-400">
                Utilisasi per jenis pinjaman
              </p>
            </div>

            <div className={`grid grid-cols-2 ${displayLoanTypes.length > 4 ? "sm:grid-cols-3" : "sm:grid-cols-4"} gap-6`}>
              {displayLoanTypes.map((type) => (
                <div key={type} className="flex flex-col items-center gap-2">
                  <SemiCircleGauge
                    value={mergedBalances[type] || 0}
                    max={LOAN_MAX[type] || 100_000_000}
                    color={LOAN_COLORS[type] || "#6b7280"}
                    label={
                      (LOAN_TYPE_LABELS_EXTENDED[type] || type).replace("Pinjaman ", "")
                    }
                  />
                  <p className="text-xs font-semibold text-gray-900">
                    {formatCurrency(mergedBalances[type] || 0)}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    / {formatCurrency(LOAN_MAX[type] || 100_000_000)}
                  </p>
                </div>
              ))}
            </div>

            {/* Mini legend */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-4 justify-center">
              {displayLoanTypes.map((type) => (
                <span
                  key={type}
                  className="flex items-center gap-1.5 text-xs text-gray-500"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: LOAN_COLORS[type] || "#6b7280" }}
                  />
                  {(LOAN_TYPE_LABELS_EXTENDED[type] || type).replace("Pinjaman ", "")}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
