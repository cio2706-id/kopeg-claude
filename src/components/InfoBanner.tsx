"use client";

import { useState } from "react";
import { X, Info } from "lucide-react";

export default function InfoBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <Info className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">
          Selamat datang di Koperasi Pegawai PT Biro Klasifikasi Indonesia.
          Layanan simpan pinjam untuk kesejahteraan anggota.
        </p>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 hover:bg-blue-700 rounded p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
