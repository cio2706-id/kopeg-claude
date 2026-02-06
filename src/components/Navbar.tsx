"use client";

import Link from "next/link";
import { Building2, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">KopegBKI</p>
              <p className="text-[10px] text-gray-400 leading-tight">Koperasi Pegawai PT BKI</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition font-medium">Beranda</Link>
            <Link href="/po/request" className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition font-medium">Ajukan PO</Link>
            <Link href="/po/track" className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition font-medium">Lacak PO</Link>
            <Link href="/payment-tracker" className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition font-medium">Lacak Pembayaran</Link>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <Link href="/member/login" className="text-sm bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition font-medium shadow-sm">Login Anggota</Link>
            <Link href="/pengurus/login" className="text-sm border border-gray-200 text-gray-700 px-5 py-2 rounded-xl hover:bg-gray-50 transition font-medium">Login Pengurus</Link>
          </div>

          <button className="md:hidden p-2 rounded-xl hover:bg-gray-50" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 space-y-1">
            <Link href="/" className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl font-medium" onClick={() => setMenuOpen(false)}>Beranda</Link>
            <Link href="/po/request" className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl font-medium" onClick={() => setMenuOpen(false)}>Ajukan PO</Link>
            <Link href="/po/track" className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl font-medium" onClick={() => setMenuOpen(false)}>Lacak PO</Link>
            <Link href="/payment-tracker" className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl font-medium" onClick={() => setMenuOpen(false)}>Lacak Pembayaran</Link>
            <div className="border-t border-gray-100 my-2" />
            <Link href="/member/login" className="block px-3 py-2.5 text-sm text-blue-600 font-semibold" onClick={() => setMenuOpen(false)}>Login Anggota</Link>
            <Link href="/pengurus/login" className="block px-3 py-2.5 text-sm text-gray-600 font-semibold" onClick={() => setMenuOpen(false)}>Login Pengurus</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
