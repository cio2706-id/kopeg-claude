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

export type InterestMethod = "flat" | "efektif" | "sliding";

export function calculateMonthlyInstallment(
  principal: number,
  annualRate: number,
  tenorMonths: number,
  method: InterestMethod = "flat"
): number {
  if (annualRate === 0) return principal / tenorMonths;

  switch (method) {
    case "flat": {
      const monthlyPrincipal = principal / tenorMonths;
      const monthlyInterest = principal * (annualRate / 100 / 12);
      return monthlyPrincipal + monthlyInterest;
    }
    case "efektif": {
      const monthlyRate = annualRate / 100 / 12;
      const factor = Math.pow(1 + monthlyRate, tenorMonths);
      return (principal * monthlyRate * factor) / (factor - 1);
    }
    case "sliding": {
      // First month installment (highest); decreases each month
      const monthlyPrincipal = principal / tenorMonths;
      const firstMonthInterest = principal * (annualRate / 100 / 12);
      return monthlyPrincipal + firstMonthInterest;
    }
    default:
      return principal / tenorMonths;
  }
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
  kepemilikan_kendaraan: "Pinjaman Kepemilikan Kendaraan",
  channeling: "Pinjaman Channeling",
};

export const ROLE_LABELS: Record<string, string> = {
  member: "Anggota",
  staf_pengadaan: "Staf Pengadaan",
  staf_treasury: "Staf Treasury",
  staf_sekper: "Staf Sekper",
  staf_piutang: "Staf Piutang",
  staf_akunting: "Staf Akunting",
  manager: "Manager",
  bendahara: "Bendahara",
  sekertaris: "Sekretaris",
  ketua: "Ketua",
};

export const LOAN_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_sekper: "Review Staf Sekper",
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
  on_review: "On Review",
  selesai: "Selesai",
  held: "Ditunda",
};

export const PO_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Diajukan",
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

// Pinjaman: Staf Sekper → Manager → Bendahara → Ketua
export const LOAN_APPROVAL_STEPS = [
  { role: "staf_sekper" as const, order: 1, label: "Review & Analisa Kredit" },
  { role: "manager" as const, order: 2, label: "Review & Evaluasi Keuangan" },
  { role: "bendahara" as const, order: 3, label: "Review & Evaluasi Keuangan" },
  { role: "ketua" as const, order: 4, label: "Persetujuan Akhir" },
];

export const LOAN_STATUS_FLOW: Record<string, string> = {
  pending_sekper: "pending_manager",
  pending_manager: "pending_bendahara",
  pending_bendahara: "pending_ketua",
  pending_ketua: "approved",
};

// PO: Staf Pengadaan (review+pricing) → Manager (approval RAB)
export const PO_APPROVAL_STEPS = [
  { role: "staf_pengadaan" as const, order: 1, label: "Review & Pendetailan Barang" },
  { role: "manager" as const, order: 2, label: "Approval RAB Barang" },
];

// ─── Number to Indonesian Words ────────────────────────────────────────────

// ─── Installment Schedule Generation (Kartu Pinjaman) ─────────────────────

export interface InstallmentRow {
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  remainingBalance: number;
  description: string;
}

/**
 * Generate installment schedule supporting 3 interest methods:
 * - FLAT (TETAP): fixed principal + fixed interest each month
 * - EFEKTIF: fixed total payment, decreasing interest, increasing principal
 * - SLIDING (MENURUN): fixed principal, decreasing interest based on remaining balance
 */
export function generateInstallmentSchedule(
  principal: number,
  annualRate: number,
  tenorMonths: number,
  disbursementDate: Date,
  method: InterestMethod = "flat"
): InstallmentRow[] {
  const rows: InstallmentRow[] = [];
  let remaining = principal;
  const monthlyRate = annualRate / 100 / 12;

  switch (method) {
    case "flat": {
      const monthlyPrincipal = principal / tenorMonths;
      const monthlyInterest = principal * monthlyRate;
      for (let i = 1; i <= tenorMonths; i++) {
        remaining -= monthlyPrincipal;
        if (remaining < 0.01) remaining = 0;
        const dueDate = new Date(disbursementDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        rows.push({
          installmentNumber: i,
          dueDate,
          principalAmount: Math.round(monthlyPrincipal),
          interestAmount: Math.round(monthlyInterest),
          totalAmount: Math.round(monthlyPrincipal + monthlyInterest),
          remainingBalance: Math.round(remaining),
          description: `Angsuran Ke-${i}`,
        });
      }
      break;
    }
    case "efektif": {
      const factor = Math.pow(1 + monthlyRate, tenorMonths);
      const fixedPayment = (principal * monthlyRate * factor) / (factor - 1);
      for (let i = 1; i <= tenorMonths; i++) {
        const interest = remaining * monthlyRate;
        const principalPortion = fixedPayment - interest;
        remaining -= principalPortion;
        if (remaining < 0.01) remaining = 0;
        const dueDate = new Date(disbursementDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        rows.push({
          installmentNumber: i,
          dueDate,
          principalAmount: Math.round(principalPortion),
          interestAmount: Math.round(interest),
          totalAmount: Math.round(fixedPayment),
          remainingBalance: Math.round(remaining),
          description: `Angsuran Ke-${i}`,
        });
      }
      break;
    }
    case "sliding": {
      const monthlyPrincipal = principal / tenorMonths;
      for (let i = 1; i <= tenorMonths; i++) {
        const interest = remaining * monthlyRate;
        remaining -= monthlyPrincipal;
        if (remaining < 0.01) remaining = 0;
        const dueDate = new Date(disbursementDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        rows.push({
          installmentNumber: i,
          dueDate,
          principalAmount: Math.round(monthlyPrincipal),
          interestAmount: Math.round(interest),
          totalAmount: Math.round(monthlyPrincipal + interest),
          remainingBalance: Math.round(remaining),
          description: `Angsuran Ke-${i}`,
        });
      }
      break;
    }
  }

  return rows;
}

// ─── Number to Indonesian Words ────────────────────────────────────────────

const SATUAN = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan"];

function ratusan(n: number): string {
  if (n === 0) return "";
  const s = Math.floor(n / 100);
  const p = Math.floor((n % 100) / 10);
  const u = n % 10;
  let result = "";
  if (s === 1) result += "Seratus ";
  else if (s > 1) result += SATUAN[s] + " Ratus ";
  if (p === 1) {
    if (u === 0) result += "Sepuluh";
    else if (u === 1) result += "Sebelas";
    else result += SATUAN[u] + " Belas";
    return result.trim();
  } else if (p > 1) {
    result += SATUAN[p] + " Puluh ";
  }
  if (u > 0) result += SATUAN[u];
  return result.trim();
}

export function numberToIndonesianWords(amount: number): string {
  if (amount === 0) return "Nol Rupiah";
  if (amount < 0) return "Minus " + numberToIndonesianWords(-amount);

  const num = Math.floor(amount);
  const groups: { divisor: number; label: string }[] = [
    { divisor: 1_000_000_000_000, label: "Triliun" },
    { divisor: 1_000_000_000, label: "Miliar" },
    { divisor: 1_000_000, label: "Juta" },
    { divisor: 1_000, label: "Ribu" },
    { divisor: 1, label: "" },
  ];

  let remaining = num;
  const parts: string[] = [];

  for (const { divisor, label } of groups) {
    const group = Math.floor(remaining / divisor);
    remaining = remaining % divisor;
    if (group === 0) continue;
    if (group === 1 && label === "Ribu") {
      parts.push("Seribu");
    } else {
      parts.push(ratusan(group) + (label ? " " + label : ""));
    }
  }

  return parts.join(" ").replace(/\s+/g, " ").trim() + " Rupiah";
}
