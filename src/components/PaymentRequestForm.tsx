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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col items-center text-center gap-3">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">Permintaan Terkirim!</h3>
          <p className="text-sm text-gray-600">Nomor tracking Anda:</p>
          <p className="text-2xl font-mono font-bold text-blue-600">{trackingNumber}</p>
          <p className="text-xs text-gray-500">Simpan nomor ini untuk melacak status permintaan Anda.</p>
          <button
            onClick={() => setTrackingNumber(null)}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Buat permintaan baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Send className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Permintaan Pembayaran</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Pilih kategori</option>
            <option value="operasional">Operasional</option>
            <option value="kegiatan">Kegiatan</option>
            <option value="pengadaan">Pengadaan</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Jelaskan permintaan pembayaran..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Mengirim..." : "Kirim Permintaan"}
        </button>
      </form>
    </section>
  );
}
