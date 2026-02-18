"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency, numberToIndonesianWords } from "@/lib/utils";
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  CreditCard,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";

interface PendingLoan {
  id: string;
  trackingNumber: string;
  loanType: string;
  amount: string;
  memberName: string;
  memberDepartment: string | null;
  coaCode: string;
}

interface PendingPO {
  id: string;
  trackingNumber: string;
  poNumber: string;
  description: string;
  totalAmount: string;
  estimatedAmount: string | null;
  requesterName: string;
  requesterDivisi: string | null;
  vendorName: string;
}

interface SppLineItem {
  accountCode: string;
  description: string;
  amount: number;
}

export default function CreateSppPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" /></div>}>
      <CreateSppPage />
    </Suspense>
  );
}

function CreateSppPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reference selection
  const [pendingLoans, setPendingLoans] = useState<PendingLoan[]>([]);
  const [pendingPOs, setPendingPOs] = useState<PendingPO[]>([]);
  const [selectedRefType, setSelectedRefType] = useState<string>("none");
  const [selectedRefId, setSelectedRefId] = useState<string>("");

  // Form fields
  const [unitKerja, setUnitKerja] = useState("KOPERASI PEGAWAI BIRO KLASIFIKASI INDONESIA");
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split("T")[0]);
  const [payableTo, setPayableTo] = useState("");
  const [amountInWords, setAmountInWords] = useState("");
  const [supportingDocs, setSupportingDocs] = useState("Terlampir");
  const [notes, setNotes] = useState("");

  // Tax
  const [hasPph23, setHasPph23] = useState(false);
  const [pphDetails, setPphDetails] = useState<{ description: string; amount: number }[]>([]);
  const [totalInvoice, setTotalInvoice] = useState<number>(0);
  const [pphDue, setPphDue] = useState<number>(0);

  // Line items
  const [items, setItems] = useState<SppLineItem[]>([{ accountCode: "", description: "", amount: 0 }]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/pengurus/login"); return; }
      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Pengurus");
      setUserEmail(user.email || "");

      // Load pending items for SPP
      const res = await fetch("/api/spp/pending-items");
      if (res.ok) {
        const data = await res.json();
        setPendingLoans(data.loans || []);
        setPendingPOs(data.purchaseOrders || []);
      }

      // Pre-select from query params
      const refType = searchParams.get("type");
      const refId = searchParams.get("ref");
      if (refType && refId) {
        setSelectedRefType(refType);
        setSelectedRefId(refId);
      }
    } catch (error) {
      console.error("Failed to load:", error);
    } finally {
      setLoading(false);
    }
  }, [router, supabase, searchParams]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-fill when selecting a reference
  useEffect(() => {
    if (selectedRefType === "loan" && selectedRefId) {
      const loan = pendingLoans.find((l) => l.id === selectedRefId);
      if (loan) {
        setPayableTo(loan.memberName || "");
        // Use requester's department as unit kerja
        if (loan.memberDepartment) {
          setUnitKerja(loan.memberDepartment);
        }
        setItems([{
          accountCode: loan.coaCode || "",
          description: `Pencairan Pinjaman ${loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1)} - ${loan.trackingNumber} - ${loan.memberName}`,
          amount: Number(loan.amount),
        }]);
      }
    } else if (selectedRefType === "purchase_order" && selectedRefId) {
      const po = pendingPOs.find((p) => p.id === selectedRefId);
      if (po) {
        setPayableTo(po.vendorName || po.requesterName || "");
        // Use requester's divisi as unit kerja
        if (po.requesterDivisi) {
          setUnitKerja(po.requesterDivisi);
        }
        // Use manager-approved price (totalAmount), fallback to estimatedAmount
        const approvedPrice = Number(po.totalAmount || po.estimatedAmount || 0);
        setItems([{
          accountCode: "",
          description: `Pembayaran PO ${po.poNumber} - ${po.description}`,
          amount: approvedPrice,
        }]);
      }
    } else if (selectedRefType === "none") {
      setUnitKerja("KOPERASI PEGAWAI BIRO KLASIFIKASI INDONESIA");
    }
  }, [selectedRefType, selectedRefId, pendingLoans, pendingPOs]);

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Auto-fill Terbilang when totalAmount changes
  useEffect(() => {
    if (totalAmount > 0) {
      setAmountInWords(numberToIndonesianWords(totalAmount));
    } else {
      setAmountInWords("");
    }
  }, [totalAmount]);

  function addItem() {
    setItems([...items, { accountCode: "", description: "", amount: 0 }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof SppLineItem, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // Validate items
    const validItems = items.filter((i) => i.accountCode && i.description && i.amount > 0);
    if (validItems.length === 0) {
      setError("Minimal 1 item pembayaran yang lengkap");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/spp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceType: selectedRefType === "none" ? null : selectedRefType,
          referenceId: selectedRefId || null,
          unitKerja,
          requestDate,
          payableTo,
          totalAmount,
          amountInWords,
          supportingDocs,
          hasPph23,
          pphDetails: hasPph23 ? pphDetails : undefined,
          totalInvoice: hasPph23 ? totalInvoice : undefined,
          pphDue: hasPph23 ? pphDue : undefined,
          notes,
          items: validItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat SPP");
        return;
      }

      router.push(`/pengurus/spp/${data.spp.id}`);
    } catch {
      setError("Gagal membuat SPP");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/pengurus/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <DashboardLayout variant="pengurus" userName={userName} userEmail={userEmail} onLogout={handleLogout}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.push("/pengurus/spp")} className="p-2 rounded-lg hover:bg-gray-200 transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Buat SPP Baru</h1>
            <p className="text-sm text-gray-500 mt-0.5">Surat Permintaan Pembayaran</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Reference Selection */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Referensi (Opsional)</h2>
          <p className="text-xs text-gray-500 mb-4">Pilih pinjaman atau PO yang sudah disetujui, atau buat SPP mandiri.</p>

          <div className="flex gap-3 mb-4">
            {[
              { key: "none", label: "SPP Mandiri", icon: <FileText className="w-4 h-4" /> },
              { key: "loan", label: `Pinjaman (${pendingLoans.length})`, icon: <CreditCard className="w-4 h-4" /> },
              { key: "purchase_order", label: `PO (${pendingPOs.length})`, icon: <ShoppingCart className="w-4 h-4" /> },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => { setSelectedRefType(opt.key); setSelectedRefId(""); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  selectedRefType === opt.key
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {selectedRefType === "loan" && (
            <div className="space-y-2">
              {pendingLoans.length === 0 ? (
                <p className="text-sm text-gray-400">Tidak ada pinjaman yang menunggu SPP.</p>
              ) : (
                pendingLoans.map((loan) => (
                  <label
                    key={loan.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      selectedRefId === loan.id ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="refId"
                      value={loan.id}
                      checked={selectedRefId === loan.id}
                      onChange={(e) => setSelectedRefId(e.target.value)}
                      className="accent-teal-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{loan.trackingNumber}</span>
                      <span className="text-xs text-gray-500 ml-2">{loan.memberName} - Pinjaman {loan.loanType}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-700">{formatCurrency(Number(loan.amount))}</span>
                  </label>
                ))
              )}
            </div>
          )}

          {selectedRefType === "purchase_order" && (
            <div className="space-y-2">
              {pendingPOs.length === 0 ? (
                <p className="text-sm text-gray-400">Tidak ada PO yang menunggu SPP.</p>
              ) : (
                pendingPOs.map((po) => (
                  <label
                    key={po.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      selectedRefId === po.id ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="refId"
                      value={po.id}
                      checked={selectedRefId === po.id}
                      onChange={(e) => setSelectedRefId(e.target.value)}
                      className="accent-teal-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{po.poNumber}</span>
                      <span className="text-xs text-gray-500 ml-2">{po.description}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-700">{formatCurrency(Number(po.totalAmount || 0))}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* SPP Header Fields */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Detail Permintaan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Unit Kerja</label>
              <input
                type="text"
                value={unitKerja}
                onChange={(e) => setUnitKerja(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal Permintaan *</label>
              <input
                type="date"
                required
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Dibayarkan Kepada *</label>
              <input
                type="text"
                required
                value={payableTo}
                onChange={(e) => setPayableTo(e.target.value)}
                placeholder="Nama penerima / vendor"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Bukti Pembayaran</label>
              <input
                type="text"
                value={supportingDocs}
                onChange={(e) => setSupportingDocs(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Rincian Pembayaran</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Item
            </button>
          </div>

          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide px-1">
              <div className="col-span-2">No. Akun</div>
              <div className="col-span-7">Keterangan Pembayaran</div>
              <div className="col-span-2 text-right">Jumlah (Rp)</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-2">
                  <input
                    type="text"
                    value={item.accountCode}
                    onChange={(e) => updateItem(idx, "accountCode", e.target.value)}
                    placeholder="5201.014"
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div className="col-span-7">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    placeholder="Keterangan pembayaran"
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.amount || ""}
                    onChange={(e) => updateItem(idx, "amount", Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div className="col-span-1 flex justify-center pt-1.5">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:text-red-600 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">TOTAL</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* PPh 23 Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="hasPph23"
              checked={hasPph23}
              onChange={(e) => setHasPph23(e.target.checked)}
              className="accent-teal-500"
            />
            <label htmlFor="hasPph23" className="text-sm font-semibold text-gray-900 cursor-pointer">
              Pemotongan PPh 23
            </label>
          </div>
          {hasPph23 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Total Tagihan</label>
                <input
                  type="number"
                  value={totalInvoice || ""}
                  onChange={(e) => setTotalInvoice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">PPh 23 (Harus Bayar)</label>
                <input
                  type="number"
                  value={pphDue || ""}
                  onChange={(e) => setPphDue(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Amount in Words & Notes */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Terbilang</label>
              <input
                type="text"
                value={amountInWords}
                onChange={(e) => setAmountInWords(e.target.value)}
                placeholder="Misal: Sebelas Juta Enam Ratus Ribu Rupiah"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Catatan</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/pengurus/spp")}
            className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-200 rounded-xl transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-600 disabled:opacity-50 transition"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {submitting ? "Menyimpan..." : "Buat SPP"}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
