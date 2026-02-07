"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Settings, Lock, Bell, Info } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifLoan, setNotifLoan] = useState(true);
  const [notifSavings, setNotifSavings] = useState(false);
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
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/member/login");
  }

  /* ---- loading state ---- */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  /* ---- toggle component ---- */

  function Toggle({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-teal-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    );
  }

  /* ---- derived ---- */

  const userInitial = userName.charAt(0).toUpperCase();

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
          <Settings className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Akun</h1>
          <p className="text-sm text-gray-500">
            Kelola profil dan preferensi Anda
          </p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* ============================================================ */}
        {/*  Profile card                                                 */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-5">
            Informasi Profil
          </h2>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-lg shadow-teal-200">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 truncate">
                {userName}
              </p>
              <p className="text-sm text-gray-500 truncate">{userEmail}</p>
              <span className="inline-block mt-2 bg-teal-100 text-teal-700 text-xs px-3 py-1 rounded-full font-medium">
                Anggota Aktif
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  Change password section                                      */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Lock className="w-4 h-4 text-gray-600" />
            </div>
            <h2 className="font-semibold text-gray-900 text-sm">
              Ubah Password
            </h2>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 font-medium">
                Perubahan password dilakukan melalui admin
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Untuk keamanan akun, silakan hubungi administrator koperasi untuk
                mengubah password Anda. Anda dapat menghubungi admin melalui email
                atau datang langsung ke kantor koperasi.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  Notification preferences                                     */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Bell className="w-4 h-4 text-gray-600" />
            </div>
            <h2 className="font-semibold text-gray-900 text-sm">
              Preferensi Notifikasi
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Notifikasi Email
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Terima pemberitahuan umum melalui email
                </p>
              </div>
              <Toggle checked={notifEmail} onChange={setNotifEmail} />
            </div>

            <div className="border-t border-gray-100" />

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Update Pinjaman
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Notifikasi perubahan status pinjaman
                </p>
              </div>
              <Toggle checked={notifLoan} onChange={setNotifLoan} />
            </div>

            <div className="border-t border-gray-100" />

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Laporan Simpanan
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Notifikasi bulanan ringkasan simpanan
                </p>
              </div>
              <Toggle checked={notifSavings} onChange={setNotifSavings} />
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Preferensi notifikasi ini hanya berlaku sebagai pengaturan tampilan.
            Fitur notifikasi akan segera tersedia.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
