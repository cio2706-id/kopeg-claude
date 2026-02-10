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
  Upload,
  Building2,
  Mail,
  UserCircle,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  section?: string;
}

const memberNav: NavItem[] = [
  { label: "Dashboard", href: "/member/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, section: "MENU" },
  { label: "Simpanan", href: "/member/savings", icon: <Wallet className="w-5 h-5" /> },
  { label: "Pinjaman", href: "/member/loans", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Pengajuan Pinjaman", href: "/member/loan-application", icon: <FileText className="w-5 h-5" /> },
  { label: "Purchase Order", href: "/po/request", icon: <ShoppingCart className="w-5 h-5" /> },
  { label: "Lacak PO", href: "/po/track", icon: <Search className="w-5 h-5" /> },
  { label: "Pembayaran", href: "/payment-tracker", icon: <FileText className="w-5 h-5" />, section: "GENERAL" },
  { label: "Pengaturan", href: "/member/settings", icon: <Settings className="w-5 h-5" /> },
];

const pengurusNav: NavItem[] = [
  { label: "Dashboard", href: "/pengurus/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, section: "MENU" },
  { label: "Anggota", href: "/pengurus/members", icon: <Users className="w-5 h-5" /> },
  { label: "Persetujuan", href: "/pengurus/approvals", icon: <CheckSquare className="w-5 h-5" /> },
  { label: "Purchase Order", href: "/pengurus/po", icon: <ShoppingCart className="w-5 h-5" /> },
  { label: "Pinjaman", href: "/pengurus/loans", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Data Management", href: "/pengurus/data-management", icon: <Upload className="w-5 h-5" /> },
  { label: "Laporan", href: "/pengurus/reports", icon: <BarChart3 className="w-5 h-5" />, section: "GENERAL" },
  { label: "Pengaturan", href: "/pengurus/settings", icon: <Settings className="w-5 h-5" /> },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  variant?: "member" | "pengurus";
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

export default function DashboardLayout({
  children,
  variant = "member",
  userName = "User",
  userEmail = "",
  onLogout,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const navItems = variant === "pengurus" ? pengurusNav : memberNav;

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Dark Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[240px] bg-[#1a1a2e] text-white transition-transform duration-200 lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">KopegBKI</p>
            <p className="text-[10px] text-gray-400">Koperasi Pegawai PT BKI</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <div key={item.href}>
                {item.section && (
                  <p className={`text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-3 ${index > 0 ? "mt-6" : ""} mb-2`}>
                    {item.section}
                  </p>
                )}
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                    isActive
                      ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Bottom: Logout */}
        <div className="px-4 pb-6">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-white/5 w-full transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-[240px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden text-gray-600"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Kopeg<span className="text-teal-500">BKI</span>
                </h1>
                <p className="text-xs text-gray-400">Kelola keuangan koperasi Anda.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-[240px]">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari sesuatu..."
                  className="bg-transparent text-sm outline-none flex-1 text-gray-600 placeholder:text-gray-400"
                />
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition relative">
                <Mail className="w-5 h-5 text-gray-500" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition relative">
                <Bell className="w-5 h-5 text-gray-500" />
              </button>
              <div className="flex items-center gap-2.5 ml-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-400">{userEmail}</p>
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
