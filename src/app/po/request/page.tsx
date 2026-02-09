"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Trash2, CheckCircle, Send, Info, Building2, ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface PoItem {
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export default function PoRequestPage() {
  const [requesterName, setRequesterName] = useState("");
  const [requesterDivisi, setRequesterDivisi] = useState("");
  const [requesterNip, setRequesterNip] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<PoItem[]>([
    { itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ trackingNumber: string; poNumber: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setIsLoggedIn(true);
    });
  }, [supabase]);

  function addItem() {
    setItems([...items, { itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof PoItem, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  const totalEstimate = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Upload document if provided
      let documentUrls: string[] = [];
      if (documentFile) {
        const formData = new FormData();
        formData.append("file", documentFile);
        formData.append("type", "po");
        const uploadRes = await fetch("/api/upload-document", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          documentUrls = [uploadData.url];
        }
      }

      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          estimatedAmount: totalEstimate,
          items: items.filter((i) => i.itemName.trim()),
          requesterName,
          requesterDivisi,
          requesterNip,
          documentUrls: documentUrls.length > 0 ? documentUrls : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengirim PO");
      }

      const data = await res.json();
      setResult({ trackingNumber: data.trackingNumber, poNumber: data.poNumber });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="min-h-screen bg-[#f0f0f0]">
        {/* Header */}
        <header className="bg-[#1a1a2e] text-white">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">KopegBKI</span>
            </div>
            <Link
              href={isLoggedIn ? "/member/dashboard" : "/"}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {isLoggedIn ? "Kembali ke Dashboard" : "Kembali ke Beranda"}
            </Link>
          </div>
        </header>

        {/* Success Content */}
        <main className="max-w-lg mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">PO Terkirim!</h2>
            <p className="text-sm text-gray-500 mb-6">Purchase Order Anda telah berhasil dikirim.</p>

            <div className="space-y-3 mb-6">
              <div className="bg-[#f4f7fe] rounded-2xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nomor PO</p>
                <p className="text-lg font-mono font-bold text-gray-900">{result.poNumber}</p>
              </div>
              <div className="bg-[#f4f7fe] rounded-2xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nomor Tracking</p>
                <p className="text-lg font-mono font-bold text-teal-600">{result.trackingNumber}</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-8">
              Simpan nomor tracking untuk melacak status PO Anda. PO akan direview oleh Staf Pengadaan.
            </p>

            <Link
              href={isLoggedIn ? "/member/dashboard" : "/"}
              className="inline-flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-600 transition-all shadow-lg shadow-teal-200"
            >
              <ArrowLeft className="w-4 h-4" />
              {isLoggedIn ? "Kembali ke Dashboard" : "Kembali ke Beranda"}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Header */}
      <header className="bg-[#1a1a2e] text-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">KopegBKI</span>
          </div>
          <Link
            href={isLoggedIn ? "/member/dashboard" : "/"}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isLoggedIn ? "Kembali ke Dashboard" : "Kembali ke Beranda"}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Formulir Purchase Order</h1>
            <p className="text-sm text-gray-500">Buat permintaan pengadaan barang/jasa</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identitas Pemohon */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Identitas Pemohon</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nama</label>
                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-[#f4f7fe] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none"
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Divisi</label>
                <input
                  type="text"
                  value={requesterDivisi}
                  onChange={(e) => setRequesterDivisi(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-[#f4f7fe] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none"
                  placeholder="Divisi / Departemen"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">NIP</label>
                <input
                  type="text"
                  value={requesterNip}
                  onChange={(e) => setRequesterNip(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-[#f4f7fe] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none"
                  placeholder="Nomor Induk Pegawai"
                />
              </div>
            </div>
          </div>

          {/* PO Description */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Deskripsi PO</h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f4f7fe] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all outline-none resize-none"
              placeholder="Jelaskan kebutuhan pengadaan barang/jasa..."
            />
          </div>

          {/* Item Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Detail Barang</h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-semibold bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" /> Tambah Barang
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-2xl p-5 relative bg-[#f4f7fe]/50">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="absolute top-4 right-4 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Nama Barang</label>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => updateItem(index, "itemName", e.target.value)}
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none"
                        placeholder="Nama barang"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Deskripsi</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none"
                        placeholder="Spesifikasi (opsional)"
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Jumlah</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none"
                        />
                      </div>
                      <div className="w-28">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Satuan</label>
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(index, "unit", e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none"
                        >
                          <option value="pcs">Pcs</option>
                          <option value="unit">Unit</option>
                          <option value="set">Set</option>
                          <option value="box">Box</option>
                          <option value="rim">Rim</option>
                          <option value="kg">Kg</option>
                          <option value="liter">Liter</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Harga Satuan (Rp)</label>
                      <input
                        type="number"
                        value={item.unitPrice || ""}
                        onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        min="0"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {item.quantity > 0 && item.unitPrice > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-right">
                      <p className="text-xs text-gray-500">
                        Subtotal: <span className="font-semibold text-gray-700">{formatCurrency(item.quantity * item.unitPrice)}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalEstimate > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-200 flex justify-between items-center">
                <span className="font-semibold text-gray-700">Estimasi Total</span>
                <span className="text-xl font-bold text-teal-600">{formatCurrency(totalEstimate)}</span>
              </div>
            )}
          </div>

          {/* Document Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Dokumen Pendukung (Opsional)</h2>
            <p className="text-xs text-gray-500 mb-3">
              Upload dokumen pendukung seperti spesifikasi barang, penawaran harga, atau dokumen lainnya (PDF, maks 5MB).
            </p>
            <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-all">
              <Upload className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                {documentFile ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{documentFile.name}</span>
                    <span className="text-xs text-gray-400">({(documentFile.size / 1024).toFixed(0)} KB)</span>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setDocumentFile(null); }}
                      className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Klik untuk memilih file PDF</span>
                )}
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size <= 5 * 1024 * 1024) setDocumentFile(file);
                  else if (file) alert("Ukuran file maks 5MB");
                }}
                className="hidden"
              />
            </label>
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Setelah dikirim, PO akan direview oleh Staf Pengadaan untuk penyesuaian dan pendetailan harga.
              Kemudian akan diajukan ke Manager untuk approval RAB.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !description.trim() || !requesterName.trim() || !requesterDivisi.trim() || !requesterNip.trim()}
            className="w-full bg-teal-500 text-white py-3.5 rounded-xl font-semibold hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-200 hover:shadow-teal-300"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Kirim Purchase Order
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
