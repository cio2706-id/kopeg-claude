"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";

export default function InfoBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <Sparkles className="w-4 h-4 shrink-0" />
        <p className="text-sm">
          Selamat datang di <span className="font-semibold">Koperasi Pegawai PT Biro Klasifikasi Indonesia</span> — Layanan simpan pinjam untuk kesejahteraan anggota.
        </p>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 hover:bg-white/10 rounded-lg p-1 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
