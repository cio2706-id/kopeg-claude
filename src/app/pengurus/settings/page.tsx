"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { ROLE_LABELS } from "@/lib/utils";
import { Settings, UserCircle, Bell, ShieldCheck } from "lucide-react";

export default function PengurusSettingsPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoApproveLimit, setAutoApproveLimit] = useState("500000");
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
      setUserRole(user.user_metadata?.role || "staf_treasury");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat pengaturan...</p>
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
            <Settings className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Kelola profil dan pengaturan sistem
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <UserCircle className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Profil</h2>
          </div>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-2xl mb-3">
              {userName.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{userName}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{userEmail}</p>
            <span className="mt-2 inline-block text-xs px-3 py-1 rounded-full font-medium bg-teal-50 text-teal-700 border border-teal-200">
              {ROLE_LABELS[userRole] || userRole}
            </span>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Nama Lengkap</span>
              <span className="text-sm font-medium text-gray-900">{userName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Email</span>
              <span className="text-sm font-medium text-gray-900">{userEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Role</span>
              <span className="text-sm font-medium text-gray-900">
                {ROLE_LABELS[userRole] || userRole}
              </span>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email Notifications */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Notifikasi Email</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Notifikasi Persetujuan
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Terima email saat ada pengajuan baru yang memerlukan persetujuan Anda.
                  </p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    emailNotifications ? "bg-teal-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      emailNotifications ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Laporan Mingguan
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Terima ringkasan aktivitas koperasi setiap minggu.
                  </p>
                </div>
                <button
                  className="relative w-11 h-6 rounded-full bg-gray-300 transition-colors"
                  disabled
                >
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
                </button>
              </div>
            </div>
          </div>

          {/* Auto-approve Limit */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">
                Batas Persetujuan Otomatis
              </h2>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-4">
                Pengajuan di bawah nilai ini dapat disetujui secara otomatis oleh sistem.
                Fitur ini masih dalam pengembangan.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5 block">
                    Batas Nilai (IDR)
                  </label>
                  <input
                    type="text"
                    value={autoApproveLimit}
                    onChange={(e) => setAutoApproveLimit(e.target.value)}
                    className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-teal-200 transition"
                    placeholder="Masukkan batas nilai"
                    disabled
                  />
                </div>
                <div className="pt-6">
                  <button
                    className="bg-gray-200 text-gray-400 px-5 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed"
                    disabled
                  >
                    Simpan
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Fitur ini akan tersedia dalam pembaruan berikutnya.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
