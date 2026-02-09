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
  simpananSukarela: string;
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

interface LoanBalances {
  reguler: number;
  khusus: number;
  barang: number;
  travel: number;
}

/* ------------------------------------------------------------------ */
/*  COA map & loan-type metadata                                       */
/* ------------------------------------------------------------------ */

const LOAN_COA: Record<string, string> = {
  reguler: "110304",
  khusus: "110305",
  barang: "110306",
  travel: "110307",
};

const LOAN_MAX: Record<string, number> = {
  reguler: 50_000_000,
  khusus: 30_000_000,
  barang: 20_000_000,
  travel: 15_000_000,
};

const LOAN_COLORS: Record<string, string> = {
  reguler: "#14b8a6",
  khusus: "#6366f1",
  barang: "#f59e0b",
  travel: "#ef4444",
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
  const [balances, setBalances] = useState<LoanBalances>({
    reguler: 0,
    khusus: 0,
    barang: 0,
    travel: 0,
  });
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
      const [savingsRes, loansRes, balancesRes] = await Promise.all([
        fetch("/api/savings"),
        fetch("/api/loans"),
        fetch("/api/accurate-balances"),
      ]);

      if (savingsRes.ok) {
        const data = await savingsRes.json();
        setSavings(data.savings || []);
      }
      if (loansRes.ok) {
        const data = await loansRes.json();
        setLoans(data.loans || []);
      }
      if (balancesRes.ok) {
        const data = await balancesRes.json();
        setBalances(
          data.balances || { reguler: 0, khusus: 0, barang: 0, travel: 0 }
        );
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
  const totalSavings = latestSaving ? parseFloat(latestSaving.totalBalance) : 0;

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

  const summaryCards = [
    {
      label: "Simpanan",
      value: totalSavings,
      icon: <Wallet className="w-5 h-5 text-blue-600" />,
      bg: "bg-blue-100",
    },
    {
      label: "Pinjaman Reguler",
      sub: LOAN_COA.reguler,
      value: balances.reguler,
      icon: <CreditCard className="w-5 h-5 text-teal-600" />,
      bg: "bg-teal-100",
    },
    {
      label: "Pinjaman Khusus",
      sub: LOAN_COA.khusus,
      value: balances.khusus,
      icon: <TrendingUp className="w-5 h-5 text-gray-600" />,
      bg: "bg-gray-200",
    },
    {
      label: "Pinjaman Barang",
      sub: LOAN_COA.barang,
      value: balances.barang,
      icon: <Package className="w-5 h-5 text-gray-600" />,
      bg: "bg-gray-200",
    },
    {
      label: "Pinjaman Travel",
      sub: LOAN_COA.travel,
      value: balances.travel,
      icon: <Plane className="w-5 h-5 text-gray-600" />,
      bg: "bg-gray-200",
    },
  ];

  /* bottom pinjaman cards - pick 3 types with highest balances */
  const pinjamanCards = (["reguler", "khusus", "barang"] as const).map(
    (type) => ({
      type,
      label: LOAN_TYPE_LABELS[type],
      coa: LOAN_COA[type],
      amount: balances[type],
      color: LOAN_COLORS[type],
    })
  );

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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selamat datang kembali, {userName}
        </p>
      </div>

      {/* ============================================================ */}
      {/*  1. SUMMARY CARDS                                            */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
              <p className="text-sm font-bold text-gray-900 mt-0.5 break-all leading-tight">
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
                <h2 className="text-lg font-bold tracking-wide">Kopeg BKI</h2>
                <p className="text-xs text-blue-200 mt-0.5 uppercase tracking-widest">
                  Anggota Koperasi
                </p>
              </div>

              <div className="mt-6">
                <p className="text-sm text-blue-200">Nama Anggota</p>
                <p className="text-xl font-bold mt-0.5">{userName}</p>
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-xs text-blue-200">Saldo Simpanan</p>
                  <p className="text-2xl font-bold mt-0.5">
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
      {/*  4. PINJAMAN CARDS  +  5. STATISTIK PINJAMAN                 */}
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
                    <p className="text-[10px] text-gray-400 font-mono">
                      COA {card.coa}
                    </p>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {(["reguler", "khusus", "barang", "travel"] as const).map(
                (type) => (
                  <div key={type} className="flex flex-col items-center gap-2">
                    <SemiCircleGauge
                      value={balances[type]}
                      max={LOAN_MAX[type]}
                      color={LOAN_COLORS[type]}
                      label={
                        LOAN_TYPE_LABELS[type]?.replace("Pinjaman ", "") || type
                      }
                    />
                    <p className="text-xs font-semibold text-gray-900">
                      {formatCurrency(balances[type])}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      / {formatCurrency(LOAN_MAX[type])}
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Mini legend */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-4 justify-center">
              {(["reguler", "khusus", "barang", "travel"] as const).map(
                (type) => (
                  <span
                    key={type}
                    className="flex items-center gap-1.5 text-xs text-gray-500"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: LOAN_COLORS[type] }}
                    />
                    {LOAN_TYPE_LABELS[type]?.replace("Pinjaman ", "")}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
