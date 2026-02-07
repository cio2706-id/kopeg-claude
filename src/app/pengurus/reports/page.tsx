"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BarChart3,
  CreditCard,
  Wallet,
  ShoppingCart,
  Users,
  ChevronRight,
} from "lucide-react";

interface ReportCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  href: string;
}

export default function PengurusReportsPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
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

  const reportCards: ReportCard[] = [
    {
      title: "Laporan Pinjaman",
      description:
        "Ringkasan pinjaman berdasarkan jenis dan status, termasuk total pencairan dan outstanding.",
      icon: <CreditCard className="w-6 h-6 text-teal-600" />,
      iconBg: "bg-teal-100",
      href: "#",
    },
    {
      title: "Laporan Simpanan",
      description:
        "Ringkasan simpanan anggota meliputi simpanan pokok, wajib, dan sukarela.",
      icon: <Wallet className="w-6 h-6 text-blue-600" />,
      iconBg: "bg-blue-100",
      href: "#",
    },
    {
      title: "Laporan Purchase Order",
      description:
        "Ringkasan purchase order berdasarkan status, vendor, dan total nilai transaksi.",
      icon: <ShoppingCart className="w-6 h-6 text-purple-600" />,
      iconBg: "bg-purple-100",
      href: "#",
    },
    {
      title: "Laporan Anggota",
      description:
        "Statistik anggota koperasi termasuk jumlah per departemen, role, dan status keanggotaan.",
      icon: <Users className="w-6 h-6 text-indigo-600" />,
      iconBg: "bg-indigo-100",
      href: "#",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat laporan...</p>
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
            <BarChart3 className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Akses berbagai laporan koperasi
            </p>
          </div>
        </div>
      </div>

      {/* Report Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((card) => (
          <a
            key={card.title}
            href={card.href}
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}
              >
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  {card.description}
                </p>
                <div className="flex items-center gap-1 mt-4 text-teal-600 text-sm font-medium">
                  Lihat Laporan
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </DashboardLayout>
  );
}
