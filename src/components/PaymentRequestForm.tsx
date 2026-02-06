"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

export default function PaymentRequestForm() {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          category,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengirim permintaan");
      }

      const data = await res.json();
      setTrackingNumber(data.trackingNumber);
      setDescription("");
      setAmount("");
      setCategory("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  if (trackingNumber) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Permintaan Terkirim!</h3>
          <p className="text-sm text-gray-500">Nomor tracking Anda:</p>
          <p className="text-2xl font-mono font-bold text-blue-600">{trackingNumber}</p>
          <p className="text-xs text-gray-400">Simpan nomor ini untuk melacak status permintaan Anda.</p>
          <button
            onClick={() => setTrackingNumber(null)}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Buat permintaan baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
          <Send className="w-4 h-4 text-blue-600" />
        </div>
        <h2 className="font-semibold text-gray-900">Permintaan Pembayaran</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
          >
            <option value="">Pilih kategori</option>
            <option value="operasional">Operasional</option>
            <option value="kegiatan">Kegiatan</option>
            <option value="pengadaan">Pengadaan</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
            placeholder="Jelaskan permintaan pembayaran..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah (Rp)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0"
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
            placeholder="0"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
        >
          {loading ? "Mengirim..." : "Kirim Permintaan"}
        </button>
      </form>
    </section>
  );
}
