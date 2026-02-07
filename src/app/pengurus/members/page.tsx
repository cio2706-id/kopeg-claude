"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency, ROLE_LABELS } from "@/lib/utils";
import { Users, Search } from "lucide-react";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
}

export default function PengurusMembersPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/pengurus/login");
        return;
      }
      setUserName(
        user.user_metadata?.full_name || user.email?.split("@")[0] || "Pengurus"
      );
      setUserEmail(user.email || "");

      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/pengurus/login");
  }

  function getRoleBadgeClasses(role: string): string {
    switch (role) {
      case "ketua":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "bendahara":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "manager":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case "member":
        return "bg-gray-100 text-gray-600 border border-gray-200";
      default:
        return "bg-sky-50 text-sky-700 border border-sky-200";
    }
  }

  const filteredMembers = members.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.department || "").toLowerCase().includes(q) ||
      (ROLE_LABELS[m.role] || m.role).toLowerCase().includes(q)
    );
  });

  const activeCount = members.filter((m) => m.isActive).length;
  const inactiveCount = members.length - activeCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Memuat data anggota...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      variant="pengurus"
      userName={userName}
      userEmail={userEmail}
      onLogout={handleLogout}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Anggota</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {members.length} anggota terdaftar &mdash; {activeCount} aktif, {inactiveCount} nonaktif
            </p>
          </div>
        </div>
      </div>

      {/* Search / Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, email, departemen, atau role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1 text-gray-600 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-5">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                {searchQuery ? "Tidak ada anggota yang cocok dengan pencarian." : "Belum ada anggota."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                    <th className="pb-3 font-medium">Nama</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Departemen</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium">Bergabung</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">
                            {member.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-gray-500">{member.email}</td>
                      <td className="py-3.5">
                        <span
                          className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-medium ${getRoleBadgeClasses(member.role)}`}
                        >
                          {ROLE_LABELS[member.role] || member.role}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-500">
                        {member.department || "-"}
                      </td>
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              member.isActive ? "bg-emerald-500" : "bg-red-400"
                            }`}
                          />
                          <span
                            className={`text-xs font-medium ${
                              member.isActive ? "text-emerald-700" : "text-red-600"
                            }`}
                          >
                            {member.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-gray-500 text-xs">
                        {new Date(member.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMembers.length > 0 && (
                <div className="pt-4 border-t border-gray-100 mt-2">
                  <p className="text-xs text-gray-400">
                    Menampilkan {filteredMembers.length} dari {members.length} anggota.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
