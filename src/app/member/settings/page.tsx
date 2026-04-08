"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Settings,
  Lock,
  UserCircle,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProfileForm {
  fullName: string;
  phone: string;
  nik: string;
  birthPlace: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
  address: string;
  employeeId: string;
  department: string;
  position: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
}

const EMPTY_FORM: ProfileForm = {
  fullName: "",
  phone: "",
  nik: "",
  birthPlace: "",
  birthDate: "",
  gender: "",
  maritalStatus: "",
  address: "",
  employeeId: "",
  department: "",
  position: "",
  bankName: "",
  bankAccount: "",
  bankAccountName: "",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MemberSettingsPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Profile state
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_FORM);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* ---- bootstrap ---- */
  const loadData = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      router.push("/member/login");
      return;
    }
    setUserEmail(authUser.email || "");

    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        const u = data.user;

        setUserName(
          u?.fullName || authUser.user_metadata?.full_name || "Anggota"
        );
        setProfile({
          fullName: u?.fullName ?? "",
          phone: u?.phone ?? "",
          nik: u?.nik ?? "",
          birthPlace: u?.birthPlace ?? "",
          birthDate: u?.birthDate ? u.birthDate.slice(0, 10) : "",
          gender: u?.gender ?? "",
          maritalStatus: u?.maritalStatus ?? "",
          address: u?.address ?? "",
          employeeId: u?.employeeId ?? "",
          department: u?.department ?? "",
          position: u?.position ?? "",
          bankName: u?.bankName ?? "",
          bankAccount: u?.bankAccount ?? "",
          bankAccountName: u?.bankAccountName ?? "",
        });
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
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

  /* ---- profile save ---- */
  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function handleSaveProfile() {
    setProfileMessage(null);

    if (!profile.fullName.trim()) {
      setProfileMessage({ type: "error", text: "Nama lengkap wajib diisi" });
      return;
    }
    if (profile.nik && !/^\d{16}$/.test(profile.nik)) {
      setProfileMessage({ type: "error", text: "NIK harus 16 digit angka" });
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setProfileMessage({
          type: "error",
          text: data.error || "Gagal menyimpan profil",
        });
        return;
      }

      setProfileMessage({
        type: "success",
        text: "Profil berhasil diperbarui",
      });
      setUserName(profile.fullName);
    } catch (err) {
      console.error(err);
      setProfileMessage({
        type: "error",
        text: "Terjadi kesalahan, silakan coba lagi",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  /* ---- password change ---- */
  async function handleChangePassword() {
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({
        type: "error",
        text: "Password saat ini wajib diisi",
      });
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Password baru minimal 8 karakter",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Konfirmasi password tidak cocok",
      });
      return;
    }

    setSavingPassword(true);
    try {
      // Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      if (signInError) {
        setPasswordMessage({
          type: "error",
          text: "Password saat ini salah",
        });
        setSavingPassword(false);
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setPasswordMessage({ type: "error", text: updateError.message });
        setSavingPassword(false);
        return;
      }

      // Mark password as changed in DB
      await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markPasswordChanged: true }),
      });

      setPasswordMessage({
        type: "success",
        text: "Password berhasil diubah",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setPasswordMessage({
        type: "error",
        text: "Terjadi kesalahan, silakan coba lagi",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  /* ---- loading ---- */
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

  const userInitial = userName.charAt(0).toUpperCase();

  /* ---- render ---- */
  return (
    <DashboardLayout
      variant="member"
      userName={userName}
      userEmail={userEmail}
      onLogout={handleLogout}
    >
      {/* Heading */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center">
          <Settings className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Akun</h1>
          <p className="text-sm text-gray-500">
            Kelola data profil dan password Anda
          </p>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
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
        {/*  Edit Profile                                                  */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <UserCircle className="w-4 h-4 text-gray-600" />
            </div>
            <h2 className="font-semibold text-gray-900 text-sm">
              Data Profil
            </h2>
          </div>

          {profileMessage && <Message {...profileMessage} />}

          {/* Personal */}
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-2">
            Data Pribadi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Lengkap">
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={userEmail}
                disabled
                className={inputClass + " bg-gray-100 cursor-not-allowed"}
              />
            </Field>
            <Field label="NIK (16 digit)">
              <input
                type="text"
                inputMode="numeric"
                maxLength={16}
                value={profile.nik}
                onChange={(e) =>
                  update("nik", e.target.value.replace(/\D/g, ""))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Nomor HP">
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Tempat Lahir">
              <input
                type="text"
                value={profile.birthPlace}
                onChange={(e) => update("birthPlace", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Tanggal Lahir">
              <input
                type="date"
                value={profile.birthDate}
                onChange={(e) => update("birthDate", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Jenis Kelamin">
              <select
                value={profile.gender}
                onChange={(e) => update("gender", e.target.value)}
                className={inputClass}
              >
                <option value="">Pilih</option>
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
            </Field>
            <Field label="Status Pernikahan">
              <select
                value={profile.maritalStatus}
                onChange={(e) => update("maritalStatus", e.target.value)}
                className={inputClass}
              >
                <option value="">Pilih</option>
                <option value="belum_menikah">Belum Menikah</option>
                <option value="menikah">Menikah</option>
                <option value="cerai_hidup">Cerai Hidup</option>
                <option value="cerai_mati">Cerai Mati</option>
              </select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Alamat">
              <textarea
                value={profile.address}
                onChange={(e) => update("address", e.target.value)}
                rows={3}
                className={inputClass}
              />
            </Field>
          </div>

          {/* Employment */}
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-6">
            Data Kepegawaian
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="NIP / ID Pegawai">
              <input
                type="text"
                value={profile.employeeId}
                onChange={(e) => update("employeeId", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Divisi / Departemen">
              <input
                type="text"
                value={profile.department}
                onChange={(e) => update("department", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Jabatan">
              <input
                type="text"
                value={profile.position}
                onChange={(e) => update("position", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          {/* Bank */}
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-6">
            Data Rekening Bank
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Bank">
              <input
                type="text"
                value={profile.bankName}
                onChange={(e) => update("bankName", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Nomor Rekening">
              <input
                type="text"
                inputMode="numeric"
                value={profile.bankAccount}
                onChange={(e) =>
                  update("bankAccount", e.target.value.replace(/\D/g, ""))
                }
                className={inputClass}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Nama Pemilik Rekening">
              <input
                type="text"
                value={profile.bankAccountName}
                onChange={(e) => update("bankAccountName", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-teal-200 transition disabled:opacity-60"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  Change Password                                               */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Lock className="w-4 h-4 text-gray-600" />
            </div>
            <h2 className="font-semibold text-gray-900 text-sm">
              Ubah Password
            </h2>
          </div>

          {passwordMessage && <Message {...passwordMessage} />}

          <div className="grid grid-cols-1 gap-4">
            <Field label="Password Saat Ini">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass + " pr-11"}
                  placeholder="Password yang Anda gunakan saat ini"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Password Baru">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Minimal 8 karakter"
                />
              </Field>
              <Field label="Konfirmasi Password Baru">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition disabled:opacity-60"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memperbarui...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Ubah Password
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const inputClass =
  "w-full px-4 py-2.5 bg-[#f7f7f7] border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Message({
  type,
  text,
}: {
  type: "success" | "error";
  text: string;
}) {
  const isSuccess = type === "success";
  return (
    <div
      className={`mb-4 rounded-xl px-4 py-3 flex items-start gap-3 border ${
        isSuccess
          ? "bg-teal-50 border-teal-100"
          : "bg-red-50 border-red-100"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      )}
      <p
        className={`text-sm ${
          isSuccess ? "text-teal-800" : "text-red-600"
        }`}
      >
        {text}
      </p>
    </div>
  );
}
