"use client";

import { useState } from "react";
import { ShoppingCart, Plus, Trash2, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { formatCurrency } from "@/lib/utils";

interface PoItem {
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export default function PoRequestPage() {
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<PoItem[]>([
    { itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ trackingNumber: string; poNumber: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          estimatedAmount: totalEstimate,
          items: items.filter((i) => i.itemName.trim()),
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">PO Terkirim!</h2>
            <div className="space-y-2 mb-6">
              <div>
                <p className="text-xs text-gray-500">Nomor PO</p>
                <p className="text-lg font-mono font-bold text-gray-900">{result.poNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Nomor Tracking</p>
                <p className="text-lg font-mono font-bold text-blue-600">{result.trackingNumber}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Simpan nomor tracking untuk melacak status PO Anda. PO akan direview oleh Staf Pengadaan.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition">
                Kembali
              </Link>
              <Link href="/payment-tracker" className="border border-gray-300 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition">
                Lacak PO
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          <h1 className="font-semibold text-gray-900">Formulir Purchase Order</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-medium text-gray-900 mb-3">Deskripsi PO</h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Jelaskan kebutuhan pengadaan barang/jasa..."
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-gray-900">Detail Barang</h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" /> Tambah Barang
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 relative">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="absolute top-3 right-3 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nama Barang</label>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => updateItem(index, "itemName", e.target.value)}
                        required
                        className="w-full border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Nama barang"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        className="w-full border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Spesifikasi (opsional)"
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Satuan</label>
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(index, "unit", e.target.value)}
                          className="w-full border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
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
                      <label className="block text-xs font-medium text-gray-600 mb-1">Harga Satuan (Rp)</label>
                      <input
                        type="number"
                        value={item.unitPrice || ""}
                        onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        min="0"
                        className="w-full border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {item.quantity > 0 && item.unitPrice > 0 && (
                    <p className="text-xs text-gray-500 mt-2 text-right">
                      Subtotal: <span className="font-medium text-gray-700">{formatCurrency(item.quantity * item.unitPrice)}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>

            {totalEstimate > 0 && (
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="font-medium text-gray-700">Estimasi Total</span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(totalEstimate)}</span>
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              Setelah dikirim, PO akan direview oleh Staf Pengadaan untuk penyesuaian dan pendetailan harga.
              Kemudian akan diajukan ke Manager untuk approval RAB.
            </p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !description.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Mengirim..." : "Kirim Purchase Order"}
          </button>
        </form>
      </main>
    </div>
  );
}
