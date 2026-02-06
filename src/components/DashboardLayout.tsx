"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  ShoppingCart,
  FileText,
  Settings,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  Users,
  CheckSquare,
  BarChart3,
  Building2,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const memberNav: NavItem[] = [
  { label: "Dashboard", href: "/member/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Simpanan", href: "/member/savings", icon: <Wallet className="w-5 h-5" /> },
  { label: "Pinjaman", href: "/member/loans", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Purchase Order", href: "/po/request", icon: <ShoppingCart className="w-5 h-5" /> },
  { label: "Pembayaran", href: "/payment-tracker", icon: <FileText className="w-5 h-5" /> },
  { label: "Pengaturan", href: "/member/settings", icon: <Settings className="w-5 h-5" /> },
];

const pengurusNav: NavItem[] = [
  { label: "Dashboard", href: "/pengurus/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Anggota", href: "/pengurus/members", icon: <Users className="w-5 h-5" /> },
  { label: "Persetujuan", href: "/pengurus/approvals", icon: <CheckSquare className="w-5 h-5" /> },
  { label: "Purchase Order", href: "/pengurus/po", icon: <ShoppingCart className="w-5 h-5" /> },
  { label: "Pinjaman", href: "/pengurus/loans", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Laporan", href: "/pengurus/reports", icon: <BarChart3 className="w-5 h-5" /> },
  { label: "Pengaturan", href: "/pengurus/settings", icon: <Settings className="w-5 h-5" /> },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  variant?: "member" | "pengurus";
  userName?: string;
  onLogout?: () => void;
}

export default function DashboardLayout({
  children,
  variant = "member",
  userName = "User",
  onLogout,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const navItems = variant === "pengurus" ? pengurusNav : memberNav;

  return (
    <div className="min-h-screen bg-[#f4f7fe]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[250px] bg-white border-r border-gray-100 transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-blue-600" />
            <span className="font-bold text-lg text-gray-900">KopegBKI</span>
          </div>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-[250px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#f4f7fe]/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden text-gray-600"
                onClick={() => setSidebarOpen(true)}
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="hidden md:flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-100 w-[300px]">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari sesuatu..."
                  className="bg-transparent text-sm outline-none flex-1 text-gray-600 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-xl bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  3
                </span>
              </button>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-400">{variant === "pengurus" ? "Pengurus" : "Anggota"}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
