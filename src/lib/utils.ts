export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function generateTrackingNumber(prefix: string = "PR"): string {
  const date = new Date();
  const dateStr =
    date.getFullYear().toString().slice(2) +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    date.getDate().toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${dateStr}${random}`;
}

export function generatePoNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PO-${year}${month}-${random}`;
}

export function calculateMonthlyInstallment(
  principal: number,
  annualRate: number,
  tenorMonths: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / tenorMonths;
  const factor = Math.pow(1 + monthlyRate, tenorMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ─── Labels ─────────────────────────────────────────────────────────────────

export const LOAN_TYPE_LABELS: Record<string, string> = {
  reguler: "Pinjaman Reguler",
  khusus: "Pinjaman Khusus",
  barang: "Pinjaman Barang",
  travel: "Pinjaman Travel",
};

export const ROLE_LABELS: Record<string, string> = {
  member: "Anggota",
  staf_pengadaan: "Staf Pengadaan",
  staf_treasury: "Staf Treasury",
  staf_piutang: "Staf Piutang",
  staf_akunting: "Staf Akunting",
  manager: "Manager",
  bendahara: "Bendahara",
  sekertaris: "Sekretaris",
  ketua: "Ketua",
};

export const LOAN_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_treasury: "Review Staf Treasury",
  analysis: "Analisa Kredit",
  pending_manager: "Review Manager",
  pending_bendahara: "Review Bendahara",
  pending_ketua: "Review Ketua",
  approved: "Disetujui",
  spp_process: "Proses SPP",
  bank_process: "Proses Bank",
  disbursed: "Dicairkan",
  rejected: "Ditolak",
};

export const PO_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Dikirim",
  review_pengadaan: "Review Staf Pengadaan",
  pricing: "Penentuan Harga",
  pending_manager: "Menunggu Approval Manager",
  approved_rab: "RAB Disetujui",
  spp_process: "Proses SPP",
  procurement: "Proses Pembelian",
  delivery: "Pengiriman Vendor",
  goods_received: "Barang Diterima Gudang",
  goods_delivered: "Barang Dikirim ke Client",
  invoicing: "Proses Invoice",
  waiting_payment: "Menunggu Pembayaran",
  payment_received: "Pembayaran Diterima",
  completed: "Selesai",
  rejected: "Ditolak",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu",
  in_review: "Dalam Review",
  adjusted: "Disesuaikan",
  approved: "Disetujui",
  rejected: "Ditolak",
  completed: "Selesai",
};

// ─── Flow Definitions (per PDF) ─────────────────────────────────────────────

// Pinjaman: Staf Treasury → Manager → Bendahara → Ketua
export const LOAN_APPROVAL_STEPS = [
  { role: "staf_treasury" as const, order: 1, label: "Review & Analisa Kredit" },
  { role: "manager" as const, order: 2, label: "Review & Evaluasi Keuangan" },
  { role: "bendahara" as const, order: 3, label: "Review & Evaluasi Keuangan" },
  { role: "ketua" as const, order: 4, label: "Persetujuan Akhir" },
];

export const LOAN_STATUS_FLOW: Record<string, string> = {
  pending_treasury: "pending_manager",
  pending_manager: "pending_bendahara",
  pending_bendahara: "pending_ketua",
  pending_ketua: "approved",
};

// PO: Staf Pengadaan (review+pricing) → Manager (approval RAB)
export const PO_APPROVAL_STEPS = [
  { role: "staf_pengadaan" as const, order: 1, label: "Review & Pendetailan Barang" },
  { role: "manager" as const, order: 2, label: "Approval RAB Barang" },
];
