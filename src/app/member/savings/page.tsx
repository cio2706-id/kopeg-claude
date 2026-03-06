"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Wallet } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency } from "@/lib/utils";

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

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function SavingsPage() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

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
      const res = await fetch("/api/savings");
      if (res.ok) {
        const data = await res.json();
        setSavings(data.savings || []);
      }
    } catch (error) {
      console.error("Failed to load savings:", error);
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
  const simpananPokok = latestSaving
    ? parseFloat(latestSaving.simpananPokok)
    : 0;
  const simpananWajib = latestSaving
    ? parseFloat(latestSaving.simpananWajib)
    : 0;
  const simpananKhusus = latestSaving
    ? parseFloat(latestSaving.simpananKhusus || "0")
    : 0;
  const simpananSukarela = latestSaving
    ? parseFloat(latestSaving.simpananSukarela)
    : 0;
  const shu = latestSaving
    ? parseFloat(latestSaving.shu || "0")
    : 0;
  const totalBalance = latestSaving
    ? parseFloat(latestSaving.totalBalance)
    : 0;

  /* ---- loading state ---- */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat data simpanan...</p>
        </div>
      </div>
    );
  }

  /* ---- summary cards ---- */

  const summaryCards = [
    {
      label: "Simpanan Wajib",
      value: simpananWajib,
      bg: "bg-teal-100",
      iconBg: "text-teal-600",
    },
    {
      label: "Simpanan Pokok",
      value: simpananPokok,
      bg: "bg-blue-100",
      iconBg: "text-blue-600",
    },
    {
      label: "Simpanan Khusus",
      value: simpananKhusus,
      bg: "bg-indigo-100",
      iconBg: "text-indigo-600",
    },
    {
      label: "Simpanan Sukarela",
      value: simpananSukarela,
      bg: "bg-amber-100",
      iconBg: "text-amber-600",
    },
    {
      label: "SHU",
      value: shu,
      bg: "bg-emerald-100",
      iconBg: "text-emerald-600",
    },
  ];

  /* ---- render ---- */

  return (
    <DashboardLayout
      variant="member"
      userName={userName}
      userEmail={userEmail}
      onLogout={handleLogout}
    >
      {/* Page heading */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Simpanan Saya</h1>
          <p className="text-sm text-gray-500">
            Ringkasan dan riwayat simpanan Anda
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Summary cards                                                */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full ${card.bg} flex items-center justify-center shrink-0`}
              >
                <Wallet className={`w-4 h-4 ${card.iconBg}`} />
              </div>
              <p className="text-xs text-gray-500 leading-tight">{card.label}</p>
            </div>
            <p className="text-base font-bold text-gray-900 break-all leading-tight">
              {formatCurrency(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  Total balance card                                           */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white p-7 shadow-lg shadow-teal-200 mb-6">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
        <div className="relative">
          <p className="text-sm text-teal-200 mb-1">Total Saldo Simpanan</p>
          <p className="text-xl font-bold">{formatCurrency(totalBalance)}</p>
          <p className="text-xs text-teal-200 mt-2">
            Berdasarkan data periode terbaru
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Savings history table                                        */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 text-sm mb-4">
          Riwayat Simpanan per Periode
        </h2>

        {savings.length === 0 ? (
          <div className="py-12 text-center">
            <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Belum ada data simpanan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 uppercase tracking-wide text-xs border-b border-gray-100">
                  <th className="pb-3 font-medium">Periode</th>
                  <th className="pb-3 font-medium text-right">Wajib</th>
                  <th className="pb-3 font-medium text-right">Pokok</th>
                  <th className="pb-3 font-medium text-right">Khusus</th>
                  <th className="pb-3 font-medium text-right">Sukarela</th>
                  <th className="pb-3 font-medium text-right">SHU</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {savings.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 text-gray-900 font-medium">
                      {s.period}
                    </td>
                    <td className="py-3 text-right text-gray-700">
                      {formatCurrency(s.simpananWajib)}
                    </td>
                    <td className="py-3 text-right text-gray-700">
                      {formatCurrency(s.simpananPokok)}
                    </td>
                    <td className="py-3 text-right text-gray-700">
                      {formatCurrency(s.simpananKhusus || "0")}
                    </td>
                    <td className="py-3 text-right text-gray-700">
                      {formatCurrency(s.simpananSukarela)}
                    </td>
                    <td className="py-3 text-right text-gray-700">
                      {formatCurrency(s.shu || "0")}
                    </td>
                    <td className="py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(s.totalBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
