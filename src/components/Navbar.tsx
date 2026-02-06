"use client";

import Link from "next/link";
import { Building2, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">KOPEG BKI</p>
              <p className="text-[10px] text-gray-500 leading-tight">Koperasi Pegawai PT BKI</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-blue-600 transition">Beranda</Link>
            <Link href="/payment-tracker" className="text-sm text-gray-600 hover:text-blue-600 transition">Lacak Pembayaran</Link>
            <Link href="/member/login" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Login Anggota</Link>
            <Link href="/pengurus/login" className="text-sm border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition">Login Pengurus</Link>
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t space-y-2">
            <Link href="/" className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded" onClick={() => setMenuOpen(false)}>Beranda</Link>
            <Link href="/payment-tracker" className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded" onClick={() => setMenuOpen(false)}>Lacak Pembayaran</Link>
            <Link href="/member/login" className="block px-3 py-2 text-sm text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>Login Anggota</Link>
            <Link href="/pengurus/login" className="block px-3 py-2 text-sm text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>Login Pengurus</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
