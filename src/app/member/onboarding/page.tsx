"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Building2,
  CheckCircle2,
  Lock,
  UserCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

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

export default function MemberOnboardingPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_FORM);

  // Password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* ---- bootstrap ---- */
  const loadProfile = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      router.push("/member/login");
      return;
    }

    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        const u = data.user;

        // Already onboarded? Skip directly to dashboard.
        if (u?.profileCompleted && u?.passwordChanged) {
          router.replace("/member/dashboard");
          return;
        }

        setProfile({
          fullName: u?.fullName ?? authUser.user_metadata?.full_name ?? "",
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
    loadProfile();
  }, [loadProfile]);

  /* ---- helpers ---- */
  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function validateProfile(): string | null {
    if (!profile.fullName.trim()) return "Nama lengkap wajib diisi";
    if (!profile.phone.trim()) return "Nomor HP wajib diisi";
    if (!profile.nik.trim()) return "NIK wajib diisi";
    if (!/^\d{16}$/.test(profile.nik.trim()))
      return "NIK harus 16 digit angka";
    if (!profile.birthPlace.trim()) return "Tempat lahir wajib diisi";
    if (!profile.birthDate) return "Tanggal lahir wajib diisi";
    if (!profile.gender) return "Jenis kelamin wajib dipilih";
    if (!profile.maritalStatus) return "Status pernikahan wajib dipilih";
    if (!profile.address.trim()) return "Alamat wajib diisi";
    if (!profile.employeeId.trim()) return "NIP / ID Pegawai wajib diisi";
    if (!profile.department.trim()) return "Divisi/Departemen wajib diisi";
    if (!profile.bankName.trim()) return "Nama bank wajib diisi";
    if (!profile.bankAccount.trim()) return "Nomor rekening wajib diisi";
    if (!profile.bankAccountName.trim())
      return "Nama pemilik rekening wajib diisi";
    return null;
  }

  function validatePassword(): string | null {
    if (!newPassword) return "Password baru wajib diisi";
    if (newPassword.length < 8) return "Password minimal 8 karakter";
    if (newPassword !== confirmPassword)
      return "Konfirmasi password tidak cocok";
    return null;
  }

  async function handleNext() {
    setError(null);
    const validationError = validateProfile();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep(2);
  }

  async function handleSubmit() {
    setError(null);
    const passwordError = validatePassword();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Update password via Supabase auth
      const { error: pwdError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (pwdError) {
        setError(pwdError.message);
        setSubmitting(false);
        return;
      }

      // 2. Save profile + flip onboarding flags
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          markProfileCompleted: true,
          markPasswordChanged: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Gagal menyimpan profil");
        setSubmitting(false);
        return;
      }

      router.replace("/member/dashboard");
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan, silakan coba lagi");
      setSubmitting(false);
    }
  }

  /* ---- loading ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  /* ---- render ---- */
  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl shadow-lg shadow-teal-200 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Selamat Datang di KopegBKI
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Lengkapi data diri dan ubah password untuk melanjutkan
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <StepIndicator
            number={1}
            label="Data Diri"
            icon={<UserCircle className="w-4 h-4" />}
            active={step === 1}
            done={step > 1}
          />
          <div
            className={`h-0.5 w-16 transition ${
              step > 1 ? "bg-teal-500" : "bg-gray-300"
            }`}
          />
          <StepIndicator
            number={2}
            label="Ubah Password"
            icon={<Lock className="w-4 h-4" />}
            active={step === 2}
            done={false}
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-6">
              {/* Personal Section */}
              <section>
                <h2 className="font-semibold text-gray-900 text-sm mb-4">
                  Data Pribadi
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nama Lengkap" required>
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      className={inputClass}
                      placeholder="Nama sesuai KTP"
                    />
                  </Field>
                  <Field label="NIK (16 digit)" required>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      value={profile.nik}
                      onChange={(e) =>
                        update("nik", e.target.value.replace(/\D/g, ""))
                      }
                      className={inputClass}
                      placeholder="3201XXXXXXXXXXXX"
                    />
                  </Field>
                  <Field label="Tempat Lahir" required>
                    <input
                      type="text"
                      value={profile.birthPlace}
                      onChange={(e) => update("birthPlace", e.target.value)}
                      className={inputClass}
                      placeholder="Jakarta"
                    />
                  </Field>
                  <Field label="Tanggal Lahir" required>
                    <input
                      type="date"
                      value={profile.birthDate}
                      onChange={(e) => update("birthDate", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Jenis Kelamin" required>
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
                  <Field label="Status Pernikahan" required>
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
                  <Field label="Nomor HP" required>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className={inputClass}
                      placeholder="08xxxxxxxxxx"
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="Alamat" required>
                    <textarea
                      value={profile.address}
                      onChange={(e) => update("address", e.target.value)}
                      rows={3}
                      className={inputClass}
                      placeholder="Alamat lengkap sesuai KTP"
                    />
                  </Field>
                </div>
              </section>

              {/* Employment Section */}
              <section>
                <h2 className="font-semibold text-gray-900 text-sm mb-4">
                  Data Kepegawaian
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="NIP / ID Pegawai" required>
                    <input
                      type="text"
                      value={profile.employeeId}
                      onChange={(e) => update("employeeId", e.target.value)}
                      className={inputClass}
                      placeholder="Nomor pegawai"
                    />
                  </Field>
                  <Field label="Divisi / Departemen" required>
                    <input
                      type="text"
                      value={profile.department}
                      onChange={(e) => update("department", e.target.value)}
                      className={inputClass}
                      placeholder="Misal: IT, Keuangan"
                    />
                  </Field>
                  <Field label="Jabatan">
                    <input
                      type="text"
                      value={profile.position}
                      onChange={(e) => update("position", e.target.value)}
                      className={inputClass}
                      placeholder="Misal: Staff, Manager"
                    />
                  </Field>
                </div>
              </section>

              {/* Bank Section */}
              <section>
                <h2 className="font-semibold text-gray-900 text-sm mb-4">
                  Data Rekening Bank
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nama Bank" required>
                    <input
                      type="text"
                      value={profile.bankName}
                      onChange={(e) => update("bankName", e.target.value)}
                      className={inputClass}
                      placeholder="Misal: BCA, Mandiri, BSI"
                    />
                  </Field>
                  <Field label="Nomor Rekening" required>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={profile.bankAccount}
                      onChange={(e) =>
                        update("bankAccount", e.target.value.replace(/\D/g, ""))
                      }
                      className={inputClass}
                      placeholder="Nomor rekening"
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="Nama Pemilik Rekening" required>
                    <input
                      type="text"
                      value={profile.bankAccountName}
                      onChange={(e) =>
                        update("bankAccountName", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Sesuai buku tabungan"
                    />
                  </Field>
                </div>
              </section>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-teal-200 transition"
                >
                  Lanjut ke Ubah Password
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <section>
                <h2 className="font-semibold text-gray-900 text-sm mb-2">
                  Ubah Password
                </h2>
                <p className="text-xs text-gray-500 mb-5">
                  Untuk keamanan akun, silakan ganti password Anda. Password
                  minimal 8 karakter.
                </p>

                <div className="space-y-4">
                  <Field label="Password Baru" required>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={inputClass + " pr-11"}
                        placeholder="Minimal 8 karakter"
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

                  <Field label="Konfirmasi Password Baru" required>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClass}
                      placeholder="Ulangi password baru"
                    />
                  </Field>
                </div>
              </section>

              <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p className="text-xs text-teal-800">
                  Setelah disimpan, Anda akan diarahkan ke dashboard. Anda
                  tetap bisa memperbarui data ini kapan saja melalui menu
                  Pengaturan.
                </p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="text-gray-600 hover:text-gray-900 px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-teal-200 transition disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Simpan & Lanjutkan
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const inputClass =
  "w-full px-4 py-2.5 bg-[#f7f7f7] border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition outline-none";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function StepIndicator({
  number,
  label,
  icon,
  active,
  done,
}: {
  number: number;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition ${
          done
            ? "bg-teal-500 text-white"
            : active
            ? "bg-teal-500 text-white shadow-lg shadow-teal-200"
            : "bg-gray-200 text-gray-500"
        }`}
      >
        {done ? <CheckCircle2 className="w-4 h-4" /> : icon || number}
      </div>
      <span
        className={`text-xs font-semibold hidden sm:inline ${
          active || done ? "text-gray-900" : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
