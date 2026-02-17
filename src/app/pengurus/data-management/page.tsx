"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency } from "@/lib/utils";
import {
  Database,
  Upload,
  FileSpreadsheet,
  Wallet,
  CreditCard,
  Scissors,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  X,
  Users,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UploadResult {
  success: boolean;
  processed?: number;
  created?: number;
  updated?: number;
  deleted?: number;
  merged?: number;
  skipped?: number;
  total?: number;
  totalAmount?: number;
  totalSimpanan?: number;
  totalPinjaman?: number;
  sheet?: string;
  errors?: string[];
  error?: string;
}

interface UploadLog {
  id: string;
  createdAt: string;
  type: string;
  subType: string;
  period: string;
  fileName: string;
  recordCount: number;
  totalAmount: number;
}

type TabKey = "anggota" | "simpanan" | "pinjaman" | "potongan";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "anggota",
    label: "Data Anggota",
    icon: <Users className="w-4 h-4" />,
  },
  {
    key: "simpanan",
    label: "Saldo Simpanan",
    icon: <Wallet className="w-4 h-4" />,
  },
  {
    key: "pinjaman",
    label: "Saldo Pinjaman",
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    key: "potongan",
    label: "Potongan Bulanan",
    icon: <Scissors className="w-4 h-4" />,
  },
];

const LOAN_TYPE_OPTIONS = [
  { value: "channeling", label: "Pinjaman Channeling (Mandiri & BSI)" },
  { value: "khusus", label: "Pinjaman Khusus" },
  { value: "reguler", label: "Pinjaman Reguler" },
  { value: "barang", label: "Pinjaman Barang" },
];

const SOURCE_TYPE_OPTIONS = [
  { value: "bki_tetap", label: "Potongan BKI Pegawai Tetap" },
  { value: "ids", label: "Potongan IDS" },
  { value: "kontrak_mns", label: "Kontrak Proyek MNS" },
  { value: "sbu_industri", label: "SBU Industri Kontrak" },
  { value: "sbu_energi", label: "SBU Energi Kontrak" },
];

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PengurusDataManagementPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>("anggota");

  // Anggota state
  const [anggotaFile, setAnggotaFile] = useState<File | null>(null);
  const [anggotaUploading, setAnggotaUploading] = useState(false);
  const [anggotaResult, setAnggotaResult] = useState<UploadResult | null>(null);
  const anggotaInputRef = useRef<HTMLInputElement>(null);

  // Simpanan state
  const [simpananPeriod, setSimpananPeriod] = useState("2025-12");
  const [simpananFile, setSimpananFile] = useState<File | null>(null);
  const [simpananUploading, setSimpananUploading] = useState(false);
  const [simpananResult, setSimpananResult] = useState<UploadResult | null>(null);
  const simpananInputRef = useRef<HTMLInputElement>(null);

  // Pinjaman state
  const [pinjamanLoanType, setPinjamanLoanType] = useState("channeling");
  const [pinjamanPeriod, setPinjamanPeriod] = useState("2025-12");
  const [pinjamanFile, setPinjamanFile] = useState<File | null>(null);
  const [pinjamanUploading, setPinjamanUploading] = useState(false);
  const [pinjamanResult, setPinjamanResult] = useState<UploadResult | null>(null);
  const pinjamanInputRef = useRef<HTMLInputElement>(null);

  // Potongan state
  const [potonganSourceType, setPotonganSourceType] = useState("bki_tetap");
  const [potonganPeriod, setPotonganPeriod] = useState(getCurrentMonth());
  const [potonganFile, setPotonganFile] = useState<File | null>(null);
  const [potonganUploading, setPotonganUploading] = useState(false);
  const [potonganResult, setPotonganResult] = useState<UploadResult | null>(null);
  const potonganInputRef = useRef<HTMLInputElement>(null);

  // Upload logs
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ─── Auth & data loading ─────────────────────────────────────────────────

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

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/upload/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Failed to load upload logs:", error);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadLogs();
  }, [loadData, loadLogs]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/pengurus/login");
  }

  // ─── Upload handlers ─────────────────────────────────────────────────────

  async function handleAnggotaUpload() {
    if (!anggotaFile) return;
    setAnggotaUploading(true);
    setAnggotaResult(null);
    try {
      const formData = new FormData();
      formData.append("file", anggotaFile);
      const res = await fetch("/api/upload/member-database", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setAnggotaResult(res.ok ? { success: true, ...data } : { success: false, ...data });
      if (res.ok) loadLogs();
    } catch {
      setAnggotaResult({ success: false, error: "Gagal mengunggah file" });
    } finally {
      setAnggotaUploading(false);
    }
  }

  async function handleSimpananUpload() {
    if (!simpananFile) return;
    setSimpananUploading(true);
    setSimpananResult(null);
    try {
      const formData = new FormData();
      formData.append("file", simpananFile);
      formData.append("period", simpananPeriod);
      const res = await fetch("/api/upload/simpanan-saldo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setSimpananResult(res.ok ? { success: true, ...data } : { success: false, ...data });
      if (res.ok) loadLogs();
    } catch {
      setSimpananResult({ success: false, error: "Gagal mengunggah file" });
    } finally {
      setSimpananUploading(false);
    }
  }

  async function handlePinjamanUpload() {
    if (!pinjamanFile) return;
    setPinjamanUploading(true);
    setPinjamanResult(null);
    try {
      const formData = new FormData();
      formData.append("file", pinjamanFile);
      formData.append("loanType", pinjamanLoanType);
      formData.append("period", pinjamanPeriod);
      const res = await fetch("/api/upload/pinjaman-saldo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setPinjamanResult(res.ok ? { success: true, ...data } : { success: false, ...data });
      if (res.ok) loadLogs();
    } catch {
      setPinjamanResult({ success: false, error: "Gagal mengunggah file" });
    } finally {
      setPinjamanUploading(false);
    }
  }

  async function handlePotonganUpload() {
    if (!potonganFile) return;
    setPotonganUploading(true);
    setPotonganResult(null);
    try {
      const formData = new FormData();
      formData.append("file", potonganFile);
      formData.append("sourceType", potonganSourceType);
      formData.append("period", potonganPeriod);
      const res = await fetch("/api/upload/potongan", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setPotonganResult(res.ok ? { success: true, ...data } : { success: false, ...data });
      if (res.ok) loadLogs();
    } catch {
      setPotonganResult({ success: false, error: "Gagal mengunggah file" });
    } finally {
      setPotonganUploading(false);
    }
  }

  // ─── Loading screen ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

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
            <Database className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Upload data keuangan koperasi dari file Excel
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm mb-6">
        <div className="flex border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Tab 0: Data Anggota */}
          {activeTab === "anggota" && (
            <UploadSection
              title="Upload Data Anggota Koperasi"
              description="Upload file DATA ANGGOTA KOPERASI UPDATE.xlsx untuk memperbarui database anggota. Data anggota lama akan diganti dengan data baru."
              file={anggotaFile}
              onFileChange={setAnggotaFile}
              inputRef={anggotaInputRef}
              uploading={anggotaUploading}
              onUpload={handleAnggotaUpload}
              result={anggotaResult}
              onClearResult={() => setAnggotaResult(null)}
            >
              <div className="sm:col-span-2">
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                  <p className="font-medium">Catatan:</p>
                  <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs">
                    <li>File harus memiliki sheet &quot;ALL&quot;</li>
                    <li>Kolom: NUP, Nama, Perusahaan, Departemen, Unit Penempatan, Jabatan, Email, Status</li>
                    <li>Anggota lama yang tidak ada di file baru akan dihapus</li>
                    <li>Akun pengurus (non-member) tidak akan terpengaruh</li>
                  </ul>
                </div>
              </div>
            </UploadSection>
          )}

          {/* Tab 1: Saldo Simpanan */}
          {activeTab === "simpanan" && (
            <UploadSection
              title="Upload Saldo Simpanan"
              description="Upload data saldo simpanan seluruh anggota (1-2x setahun)"
              file={simpananFile}
              onFileChange={setSimpananFile}
              inputRef={simpananInputRef}
              uploading={simpananUploading}
              onUpload={handleSimpananUpload}
              result={simpananResult}
              onClearResult={() => setSimpananResult(null)}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Periode
                </label>
                <input
                  type="month"
                  value={simpananPeriod}
                  onChange={(e) => setSimpananPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </UploadSection>
          )}

          {/* Tab 2: Saldo Pinjaman */}
          {activeTab === "pinjaman" && (
            <UploadSection
              title="Upload Saldo Pinjaman"
              description="Upload data saldo pinjaman per jenis pinjaman"
              file={pinjamanFile}
              onFileChange={setPinjamanFile}
              inputRef={pinjamanInputRef}
              uploading={pinjamanUploading}
              onUpload={handlePinjamanUpload}
              result={pinjamanResult}
              onClearResult={() => setPinjamanResult(null)}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Pinjaman
                </label>
                <select
                  value={pinjamanLoanType}
                  onChange={(e) => setPinjamanLoanType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                >
                  {LOAN_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Periode
                </label>
                <input
                  type="month"
                  value={pinjamanPeriod}
                  onChange={(e) => setPinjamanPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </UploadSection>
          )}

          {/* Tab 3: Potongan Bulanan */}
          {activeTab === "potongan" && (
            <UploadSection
              title="Upload Potongan Bulanan"
              description="Upload data potongan bulanan (menambah simpanan, mengurangi pinjaman)"
              file={potonganFile}
              onFileChange={setPotonganFile}
              inputRef={potonganInputRef}
              uploading={potonganUploading}
              onUpload={handlePotonganUpload}
              result={potonganResult}
              onClearResult={() => setPotonganResult(null)}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sumber Potongan
                </label>
                <select
                  value={potonganSourceType}
                  onChange={(e) => setPotonganSourceType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                >
                  {SOURCE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Periode (YYYY-MM)
                </label>
                <input
                  type="month"
                  value={potonganPeriod}
                  onChange={(e) => setPotonganPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </UploadSection>
          )}
        </div>
      </div>

      {/* Upload History */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <Clock className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Riwayat Upload</h2>
        </div>
        <div className="overflow-x-auto">
          {logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              Belum ada riwayat upload
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Tanggal</th>
                  <th className="px-6 py-3 font-medium">Tipe</th>
                  <th className="px-6 py-3 font-medium">Sub-Tipe</th>
                  <th className="px-6 py-3 font-medium">Periode</th>
                  <th className="px-6 py-3 font-medium">Nama File</th>
                  <th className="px-6 py-3 font-medium text-right">Records</th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="px-6 py-3 text-gray-700">
                      {new Date(log.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{log.subType || "-"}</td>
                    <td className="px-6 py-3 text-gray-600">{log.period}</td>
                    <td className="px-6 py-3 text-gray-600 max-w-[200px] truncate">
                      {log.fileName}
                    </td>
                    <td className="px-6 py-3 text-gray-700 text-right font-mono">
                      {log.recordCount}
                    </td>
                    <td className="px-6 py-3 text-gray-700 text-right font-mono">
                      {formatCurrency(log.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Shared Upload Section Component ─────────────────────────────────────────

function UploadSection({
  title,
  description,
  children,
  file,
  onFileChange,
  inputRef,
  uploading,
  onUpload,
  result,
  onClearResult,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  file: File | null;
  onFileChange: (f: File | null) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  uploading: boolean;
  onUpload: () => void;
  result: UploadResult | null;
  onClearResult: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (
      droppedFile &&
      (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))
    ) {
      onFileChange(droppedFile);
      onClearResult();
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    onFileChange(selected);
    onClearResult();
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>

      {/* File drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-teal-400 bg-teal-50"
            : file
              ? "border-teal-300 bg-teal-50/50"
              : "border-gray-300 hover:border-gray-400 bg-gray-50/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-teal-600" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
                onClearResult();
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="ml-2 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-10 h-10 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600">
              Drag & drop file Excel di sini, atau{" "}
              <span className="text-teal-600 font-medium">pilih file</span>
            </p>
            <p className="text-xs text-gray-400">Format: .xlsx atau .xls</p>
          </div>
        )}
      </div>

      {/* Upload button */}
      <div className="flex justify-end">
        <button
          onClick={onUpload}
          disabled={!file || uploading}
          className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Mengunggah...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload
            </>
          )}
        </button>
      </div>

      {/* Result display */}
      {result && <UploadResultDisplay result={result} />}
    </div>
  );
}

// ─── Upload Result Display ───────────────────────────────────────────────────

function UploadResultDisplay({ result }: { result: UploadResult }) {
  const [errorsExpanded, setErrorsExpanded] = useState(false);

  if (!result.success) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Upload Gagal</p>
            <p className="text-sm text-red-600 mt-1">
              {result.error || "Terjadi kesalahan saat memproses file"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const errors = result.errors || [];
  const showToggle = errors.length > 5;
  const visibleErrors = errorsExpanded ? errors : errors.slice(0, 5);

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-green-800">Upload Berhasil</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 ml-8">
        {result.processed !== undefined && (
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Diproses</p>
            <p className="text-lg font-semibold text-gray-900">{result.processed}</p>
          </div>
        )}
        {result.created !== undefined && (
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Baru Dibuat</p>
            <p className="text-lg font-semibold text-green-600">{result.created}</p>
          </div>
        )}
        {result.updated !== undefined && (
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Diperbarui</p>
            <p className="text-lg font-semibold text-blue-600">{result.updated}</p>
          </div>
        )}
        {result.deleted !== undefined && (
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Dihapus</p>
            <p className="text-lg font-semibold text-red-600">{result.deleted}</p>
          </div>
        )}
        {result.merged !== undefined && result.merged > 0 && (
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Duplikat Digabung</p>
            <p className="text-lg font-semibold text-orange-600">{result.merged}</p>
          </div>
        )}
        {result.skipped !== undefined && (
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Dilewati</p>
            <p className="text-lg font-semibold text-gray-900">{result.skipped}</p>
          </div>
        )}
        {result.totalAmount !== undefined && (
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(result.totalAmount)}
            </p>
          </div>
        )}
        {result.totalSimpanan !== undefined && (
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Total Simpanan</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(result.totalSimpanan)}
            </p>
          </div>
        )}
        {result.totalPinjaman !== undefined && (
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Total Pinjaman</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(result.totalPinjaman)}
            </p>
          </div>
        )}
        {result.sheet && (
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Sheet</p>
            <p className="text-sm font-semibold text-gray-900">{result.sheet}</p>
          </div>
        )}
      </div>

      {/* Errors list */}
      {errors.length > 0 && (
        <div className="ml-8">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-medium text-amber-700">
              {errors.length} peringatan
            </p>
          </div>
          <ul className="space-y-1">
            {visibleErrors.map((err, i) => (
              <li key={i} className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                {err}
              </li>
            ))}
          </ul>
          {showToggle && (
            <button
              onClick={() => setErrorsExpanded(!errorsExpanded)}
              className="flex items-center gap-1 mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              {errorsExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Sembunyikan
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Tampilkan semua ({errors.length})
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
