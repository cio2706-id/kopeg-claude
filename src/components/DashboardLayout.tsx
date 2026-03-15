"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Clock,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  section?: string;
  badgeKey?: string;
}

interface NotificationItem {
  id: string;
  type: "approval" | "spp_create" | "spp_approval" | "po_task";
  title: string;
  description: string;
  href: string;
  createdAt: string;
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
  { label: "Persetujuan", href: "/pengurus/approvals", icon: <CheckSquare className="w-5 h-5" />, badgeKey: "pendingApprovals" },
  { label: "Purchase Order", href: "/pengurus/po", icon: <ShoppingCart className="w-5 h-5" />, badgeKey: "pendingPoTasks" },
  { label: "Pinjaman", href: "/pengurus/loans", icon: <CreditCard className="w-5 h-5" /> },
  { label: "SPP", href: "/pengurus/spp", icon: <FileText className="w-5 h-5" />, badgeKey: "totalSpp" },
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

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function getNotifIcon(type: NotificationItem["type"]) {
  switch (type) {
    case "approval":
      return <CheckSquare className="w-4 h-4 text-blue-500" />;
    case "spp_create":
      return <FileText className="w-4 h-4 text-orange-500" />;
    case "spp_approval":
      return <FileText className="w-4 h-4 text-purple-500" />;
    case "po_task":
      return <ShoppingCart className="w-4 h-4 text-teal-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
}

function getNotifBgColor(type: NotificationItem["type"]) {
  switch (type) {
    case "approval":
      return "bg-blue-50";
    case "spp_create":
      return "bg-orange-50";
    case "spp_approval":
      return "bg-purple-50";
    case "po_task":
      return "bg-teal-50";
    default:
      return "bg-gray-50";
  }
}

export default function DashboardLayout({
  children,
  variant = "member",
  userName = "User",
  userEmail = "",
  onLogout,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const navItems = variant === "pengurus" ? pengurusNav : memberNav;

  // Fetch notification counts for pengurus
  useEffect(() => {
    if (variant !== "pengurus") return;
    let cancelled = false;
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setBadges(data);
          setNotifications(data.notifications || []);
        }
      } catch {
        // Silently ignore
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [variant]);

  // Close bell dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    if (bellOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [bellOpen]);

  const totalNotifications = badges.totalNotifications || 0;

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
            const badgeCount = item.badgeKey ? (badges[item.badgeKey] || 0) : 0;
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
                  <span className="flex-1">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-red-500 text-white"
                    }`}>
                      {badgeCount}
                    </span>
                  )}
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

              {/* Bell Notification Button with Dropdown */}
              <div ref={bellRef} className="relative">
                <button
                  onClick={() => setBellOpen(!bellOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition relative"
                >
                  <Bell className="w-5 h-5 text-gray-500" />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                      {totalNotifications > 99 ? "99+" : totalNotifications}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {bellOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 text-sm">Notifikasi</h3>
                      {totalNotifications > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          {totalNotifications} tugas
                        </span>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">Tidak ada notifikasi</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => {
                              setBellOpen(false);
                              router.push(notif.href);
                            }}
                            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-50 last:border-b-0"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${getNotifBgColor(notif.type)}`}>
                              {getNotifIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">{notif.description}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3 text-gray-300" />
                                <span className="text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                          </button>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                        <button
                          onClick={() => {
                            setBellOpen(false);
                            router.push("/pengurus/dashboard");
                          }}
                          className="text-xs text-teal-600 hover:text-teal-700 font-medium w-full text-center"
                        >
                          Lihat semua di Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
