"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { ROLE_LABELS } from "@/lib/utils";
import { Users, Search, Edit3, Check, X, Plus, Loader2 } from "lucide-react";

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

const ALL_ROLES = [
  "member",
  "staf_pengadaan",
  "staf_treasury",
  "staf_sekper",
  "staf_piutang",
  "staf_akunting",
  "manager",
  "bendahara",
  "sekertaris",
  "ketua",
];

export default function PengurusMembersPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: "",
    email: "",
    role: "member",
    phone: "",
    employeeId: "",
    department: "",
    position: "",
    company: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
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

  function startEditRole(member: User) {
    setEditingId(member.id);
    setEditRole(member.role);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditRole("");
  }

  async function saveRole(memberId: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId, role: editRole }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId ? { ...m, role: editRole } : m
          )
        );
        setEditingId(null);
      } else {
        alert("Gagal mengubah role");
      }
    } catch {
      alert("Gagal mengubah role");
    } finally {
      setSaving(false);
    }
  }

  function openAddModal() {
    setAddForm({ fullName: "", email: "", role: "member", phone: "", employeeId: "", department: "", position: "", company: "" });
    setAddError("");
    setShowAddModal(true);
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Gagal menambah anggota");
        return;
      }
      setShowAddModal(false);
      loadData(); // Refresh the list
    } catch {
      setAddError("Gagal menambah anggota");
    } finally {
      setAddLoading(false);
    }
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
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-600 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Anggota
        </button>
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
                        {editingId === member.id ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                            >
                              {ALL_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {ROLE_LABELS[r] || r}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => saveRole(member.id)}
                              disabled={saving}
                              className="p-1 rounded-md bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-medium ${getRoleBadgeClasses(member.role)}`}
                            >
                              {ROLE_LABELS[member.role] || member.role}
                            </span>
                            <button
                              onClick={() => startEditRole(member)}
                              className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                              title="Ubah role"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
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
      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Tambah Anggota Baru</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="p-5 space-y-4">
              {addError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {addError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={addForm.fullName}
                  onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Nama lengkap anggota"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="email@kopeg-bki.id"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">NUP / No. Anggota</label>
                  <input
                    type="text"
                    value={addForm.employeeId}
                    onChange={(e) => setAddForm({ ...addForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Nomor anggota"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">No. Telepon</label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="08xxxxxxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Perusahaan</label>
                  <input
                    type="text"
                    value={addForm.company}
                    onChange={(e) => setAddForm({ ...addForm, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="BKI / IDS / KOPERASI"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Departemen</label>
                  <input
                    type="text"
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Nama departemen"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Jabatan</label>
                  <input
                    type="text"
                    value={addForm.position}
                    onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Jabatan anggota"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r] || r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex items-center gap-2 px-5 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 disabled:opacity-50 transition"
                >
                  {addLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
