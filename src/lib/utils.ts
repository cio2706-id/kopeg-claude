export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function generateTrackingNumber(): string {
  const date = new Date();
  const prefix = "PR";
  const dateStr =
    date.getFullYear().toString().slice(2) +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    date.getDate().toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${dateStr}${random}`;
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

export const LOAN_TYPE_LABELS: Record<string, string> = {
  regular: "Pinjaman Reguler",
  emergency: "Pinjaman Darurat",
  education: "Pinjaman Pendidikan",
  housing: "Pinjaman Perumahan",
};

export const ROLE_LABELS: Record<string, string> = {
  member: "Anggota",
  staff: "Staff",
  manager: "Manager",
  bendahara: "Bendahara",
  sekertaris: "Sekretaris",
  ketua: "Ketua",
};

export const LOAN_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_staff: "Menunggu Staff",
  pending_manager: "Menunggu Manager",
  pending_bendahara: "Menunggu Bendahara",
  pending_ketua: "Menunggu Ketua",
  approved: "Disetujui",
  rejected: "Ditolak",
  disbursed: "Dicairkan",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu",
  in_review: "Dalam Review",
  adjusted: "Disesuaikan",
  approved: "Disetujui",
  rejected: "Ditolak",
  completed: "Selesai",
};

export const APPROVAL_FLOW_ORDER: Record<string, number> = {
  staff: 1,
  manager: 2,
  bendahara: 3,
  ketua: 4,
};
