"use client";

// Pengurus loan print page — reuses the same component as member
// Just with pengurus auth redirect
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface LoanDetail {
  loan: {
    id: string;
    trackingNumber: string;
    loanType: string;
    amount: string;
    interestRate: string;
    tenorMonths: number;
    monthlyInstallment: string;
    purpose: string | null;
    status: string;
    formData: Record<string, unknown> | null;
    createdAt: string;
  };
  requester: {
    fullName: string;
    email: string;
    department: string | null;
    employeeId: string | null;
  };
  approvalSteps: {
    approverRole: string;
    action: string | null;
    approver: { fullName: string } | null;
    decidedAt: string | null;
  }[];
}

export default function PengurusLoanPrintPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [data, setData] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/pengurus/login"); return; }

    const res = await fetch(`/api/loans/${id}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [id, router, supabase]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    if (data && !loading) setTimeout(() => window.print(), 500);
  }, [data, loading]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}><p>Memuat formulir...</p></div>;
  if (!data) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}><p>Data tidak ditemukan.</p></div>;

  const { loan, requester, approvalSteps } = data;
  const fd = loan.formData || {};
  const type = loan.loanType;
  const createdDate = new Date(loan.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const ketuaStep = approvalSteps.find((s) => s.approverRole === "ketua");
  const ketuaName = ketuaStep?.approver?.fullName || "ADESTA MUNAS LATIEF";

  const printStyles = `
    @media print { body { margin: 0; padding: 0; } .no-print { display: none !important; } .print-page { padding: 0; } }
    .print-page { font-family: "Times New Roman", Times, serif; max-width: 210mm; margin: 0 auto; padding: 20px 30px; font-size: 12px; line-height: 1.5; color: #000; }
    .letterhead { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 16px; }
    .letterhead h1 { font-size: 16px; font-weight: bold; margin: 0; }
    .letterhead p { font-size: 11px; margin: 2px 0; }
    .form-title { text-align: center; font-size: 14px; font-weight: bold; margin: 16px 0; text-decoration: underline; }
    .form-table { border: 1px solid #000; }
    .form-table th { border-bottom: 1px solid #000; background: #f5f5f5; font-size: 13px; }
    .section { margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ccc; }
    .section-title { font-size: 12px; font-weight: bold; margin: 8px 0 6px 0; text-decoration: underline; }
    .field-row { display: flex; margin-bottom: 4px; }
    .field-label { width: 180px; flex-shrink: 0; }
    .field-value { flex: 1; }
    .signature-space { height: 60px; margin: 8px 0; }
    .print-btn { background: #14b8a6; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; cursor: pointer; margin-right: 8px; }
    .back-btn { background: #e5e7eb; color: #374151; border: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; cursor: pointer; }
  `;

  const Letterhead = () => (
    <div className="letterhead">
      <h1>KOPERASI PEGAWAI BIRO KLASIFIKASI INDONESIA</h1>
      <p>Badan Hukum No. 2182/BH/DK.10.14/VII/2000</p>
      <p>Jl. Yos Sudarso 38-40 Tanjung Priok, Jakarta 14320</p>
      <p>Telp. (021) 43910058</p>
    </div>
  );

  const Buttons = () => (
    <div className="no-print" style={{ textAlign: "center", marginTop: "20px" }}>
      <button onClick={() => window.print()} className="print-btn">Cetak / Download PDF</button>
      <button onClick={() => window.history.back()} className="back-btn">Kembali</button>
    </div>
  );

  // ── Reguler ──
  if (type === "reguler") {
    const criteria = String(fd.loanCriteria || "");
    const musibahType = String(fd.musibahType || "");
    return (
      <div className="print-page">
        <style dangerouslySetInnerHTML={{ __html: printStyles }} />
        <Letterhead />
        <table className="form-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={{ width: "50%", borderRight: "1px solid #000", padding: "8px", textAlign: "center" }}>SURAT PERMOHONAN PINJAMAN</th>
            <th style={{ width: "50%", padding: "8px", textAlign: "center" }}>DISETUJUI</th>
          </tr></thead>
          <tbody><tr>
            <td style={{ borderRight: "1px solid #000", padding: "12px", verticalAlign: "top" }}>
              <div className="field-row"><span className="field-label">Nama</span><span className="field-value">: {requester.fullName}</span></div>
              <div className="field-row"><span className="field-label">Anggota No</span><span className="field-value">: {requester.employeeId || "-"}</span></div>
              <div className="field-row"><span className="field-label">Jenis Pinjaman</span><span className="field-value">: Pinjaman Reguler</span></div>
              <div className="field-row"><span className="field-label">Untuk dipergunakan</span><span className="field-value">: {loan.purpose || "-"}</span></div>
              <div className="field-row"><span className="field-label">Dalam bulan</span><span className="field-value">: {String(fd.requestMonth || "-")}</span></div>
              <div className="field-row"><span className="field-label">Jumlah yg diminta</span><span className="field-value">: {formatCurrency(loan.amount)}</span></div>
              <div className="field-row"><span className="field-label">Sisa Pinj. yg lalu</span><span className="field-value">: {fd.previousLoanBalance ? formatCurrency(Number(fd.previousLoanBalance)) : "Rp 0"}</span></div>
              <div style={{ marginTop: "24px" }}>
                <p>Jakarta, {createdDate}</p>
                <p style={{ marginTop: "8px" }}>Yang Mengajukan Permohonan,</p>
                <div className="signature-space" />
                <p style={{ fontWeight: "bold" }}>({requester.fullName})</p>
              </div>
            </td>
            <td style={{ padding: "12px", verticalAlign: "top" }}>
              <div className="field-row"><span className="field-label">Besarnya Pinjaman</span><span className="field-value">: {formatCurrency(loan.amount)}</span></div>
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontWeight: "bold" }}>I. Kriteria Pinjaman:</p>
                <div style={{ marginLeft: "12px", marginTop: "8px" }}>
                  <p>{criteria === "pendidikan" ? "[x]" : "[ ]"} a. Pendidikan - 0.25%</p>
                  <p>{criteria === "perumahan" ? "[x]" : "[ ]"} b. Perumahan - 0.25%</p>
                  <p>{criteria === "musibah" ? "[x]" : "[ ]"} c. Musibah - 0.25%</p>
                  {criteria === "musibah" && <div style={{ marginLeft: "20px", marginTop: "4px" }}>
                    <p>{musibahType === "kecelakaan" ? "[x]" : "[ ]"} Kecelakaan</p>
                    <p>{musibahType === "kematian" ? "[x]" : "[ ]"} Kematian</p>
                    <p>{musibahType === "kebanjiran" ? "[x]" : "[ ]"} Kebanjiran</p>
                    <p>{musibahType === "kebakaran" ? "[x]" : "[ ]"} Kebakaran</p>
                  </div>}
                </div>
              </div>
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontWeight: "bold" }}>II. CATATAN:</p>
                <p style={{ marginTop: "4px" }}>Tenor: {loan.tenorMonths} bulan</p>
                <p>Angsuran/bulan: {formatCurrency(loan.monthlyInstallment)}</p>
              </div>
              <div style={{ marginTop: "24px" }}>
                <p>Jakarta, ________________</p>
                <p style={{ marginTop: "8px" }}>Menyetujui,</p>
                <div className="signature-space" />
                <p style={{ fontWeight: "bold" }}>({ketuaName})</p>
                <p>Ketua Koperasi Pegawai BKI</p>
              </div>
            </td>
          </tr></tbody>
        </table>
        <Buttons />
      </div>
    );
  }

  // ── Khusus ──
  if (type === "khusus") {
    return (
      <div className="print-page">
        <style dangerouslySetInnerHTML={{ __html: printStyles }} />
        <Letterhead />
        <h2 className="form-title">FORMULIR PERMOHONAN PINJAMAN KHUSUS ANGGOTA</h2>
        <div className="section">
          <h3 className="section-title">DATA PRIBADI PEMOHON</h3>
          <div className="field-row"><span className="field-label">Nama Pemohon</span><span className="field-value">: {requester.fullName}</span></div>
          <div className="field-row"><span className="field-label">Tempat & Tanggal Lahir</span><span className="field-value">: {String(fd.tempatTanggalLahir || "-")}</span></div>
          <div className="field-row"><span className="field-label">Nomor KTP</span><span className="field-value">: {String(fd.nomorKtp || "-")} (Copy KTP terlampir)</span></div>
          <div className="field-row"><span className="field-label">Alamat Rumah / Kode Pos</span><span className="field-value">: {String(fd.alamat || "-")}</span></div>
          <div className="field-row"><span className="field-label">Telepon / Handphone</span><span className="field-value">: {String(fd.telepon || "-")}</span></div>
          <div className="field-row"><span className="field-label">Nama Ibu Kandung</span><span className="field-value">: {String(fd.namaIbuKandung || "-")} (Copy KK terlampir)</span></div>
        </div>
        <div className="section">
          <h3 className="section-title">DATA PEKERJAAN</h3>
          <div className="field-row"><span className="field-label">Jabatan saat ini</span><span className="field-value">: {String(fd.jabatan || "-")}</span></div>
          <div className="field-row"><span className="field-label">Unit Kerja / Produksi</span><span className="field-value">: {String(fd.unitKerja || "-")} {fd.telpExt ? `Telp. Ext. ${fd.telpExt}` : ""}</span></div>
          <div className="field-row"><span className="field-label">Mulai Kerja Sejak</span><span className="field-value">: {String(fd.mulaiKerjaSejak || "-")}</span></div>
          <div className="field-row"><span className="field-label">Nama Atasan Langsung</span><span className="field-value">: {String(fd.namaAtasan || "-")}</span></div>
        </div>
        <div className="section">
          <h3 className="section-title">DATA KEUANGAN</h3>
          <div className="field-row"><span className="field-label">Penghasilan Bruto / Bulan</span><span className="field-value">: {fd.penghasilanBruto ? formatCurrency(Number(fd.penghasilanBruto)) : "-"}</span></div>
          <div className="field-row"><span className="field-label">Nama Bank</span><span className="field-value">: {String(fd.namaBank || "-")}</span></div>
          <div className="field-row"><span className="field-label">Nomor Rekening</span><span className="field-value">: {String(fd.nomorRekening || "-")}</span></div>
        </div>
        <div className="section">
          <h3 className="section-title">DATA KREDIT</h3>
          <div className="field-row"><span className="field-label">Jumlah Kredit Dimohon</span><span className="field-value">: {formatCurrency(loan.amount)}</span></div>
          <div className="field-row"><span className="field-label">Jenis Agunan (&gt; Rp 50 Juta)</span><span className="field-value">: {String(fd.jenisAgunan || "-")}</span></div>
          <div className="field-row"><span className="field-label">Tujuan Penggunaan Kredit</span><span className="field-value">: {loan.purpose || "-"}</span></div>
          <div className="field-row"><span className="field-label">Jangka Waktu Kredit</span><span className="field-value">: {loan.tenorMonths} Bulan</span></div>
        </div>
        <div className="section">
          <p style={{ fontSize: "10px", lineHeight: "1.6" }}>
            1. Seluruh informasi yang saya berikan adalah benar dan saya mengotorisasi Koperasi untuk melakukan verifikasi.<br />
            2. Saya menyetujui pemotongan gaji untuk angsuran dan mengotorisasi PT BKI untuk memproses.<br />
            3. Apabila keanggotaan atau kepegawaian berakhir, sisa pinjaman akan dipotong dari pesangon/pensiun.<br />
            4. Saya setuju mematuhi seluruh prosedur Koperasi; Koperasi dapat menyetujui/menolak tanpa penjelasan.
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
          <div style={{ textAlign: "center", width: "45%" }}>
            <p>Mengetahui,</p><p>Ketua Koperasi Pegawai BKI</p>
            <div className="signature-space" />
            <p style={{ fontWeight: "bold" }}>({ketuaName})</p>
          </div>
          <div style={{ textAlign: "center", width: "45%" }}>
            <p>Jakarta, {createdDate}</p><p>Pemohon,</p>
            <div className="signature-space" />
            <p style={{ fontWeight: "bold" }}>({requester.fullName})</p>
          </div>
        </div>
        <Buttons />
      </div>
    );
  }

  // ── Barang ──
  if (type === "barang") {
    return (
      <div className="print-page">
        <style dangerouslySetInnerHTML={{ __html: printStyles }} />
        <Letterhead />
        <h2 className="form-title">FORMULIR PERMOHONAN PINJAMAN BARANG</h2>
        <table className="form-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={{ width: "50%", borderRight: "1px solid #000", padding: "8px", textAlign: "center" }}>PEMOHON</th>
            <th style={{ width: "50%", padding: "8px", textAlign: "center" }}>DISETUJUI</th>
          </tr></thead>
          <tbody><tr>
            <td style={{ borderRight: "1px solid #000", padding: "12px", verticalAlign: "top" }}>
              <div className="field-row"><span className="field-label">Nama</span><span className="field-value">: {requester.fullName}</span></div>
              <div className="field-row"><span className="field-label">Unit Kerja</span><span className="field-value">: {String(fd.unitKerja || requester.department || "-")}</span></div>
              <div className="field-row"><span className="field-label">Status Kepegawaian</span><span className="field-value">: {String(fd.statusKepegawaian || "-")}</span></div>
              <div className="field-row"><span className="field-label">Jenis Kebutuhan</span><span className="field-value">: {String(fd.jenisKebutuhan || "-")}</span></div>
              <div className="field-row"><span className="field-label">Merek</span><span className="field-value">: {String(fd.merek || "-")}</span></div>
              <div className="field-row"><span className="field-label">Tipe</span><span className="field-value">: {String(fd.tipe || "-")}</span></div>
              <div className="field-row"><span className="field-label">Lain-lain</span><span className="field-value">: {String(fd.lainLain || "-")}</span></div>
              <div className="field-row"><span className="field-label">Dalam</span><span className="field-value">: {loan.tenorMonths} bulan</span></div>
              <div className="field-row"><span className="field-label">Jumlah Pinjaman</span><span className="field-value">: {formatCurrency(loan.amount)}</span></div>
              <div className="field-row"><span className="field-label">Sisa Pinjaman lalu</span><span className="field-value">: {fd.previousLoanBalance ? formatCurrency(Number(fd.previousLoanBalance)) : "Rp 0"}</span></div>
              <div style={{ marginTop: "12px", fontSize: "10px", lineHeight: "1.6" }}>
                <p>1. Pemohon berjanji akan mematuhi ketentuan pinjaman Koperasi Pegawai BKI.</p>
                <p>2. Apabila tidak lagi menjadi anggota/pegawai PT BKI, seluruh hutang dilunasi sekaligus.</p>
              </div>
              <div style={{ marginTop: "20px" }}>
                <p>Jakarta, {createdDate}</p><p style={{ marginTop: "8px" }}>Yang Mengajukan Permohonan,</p>
                <div className="signature-space" /><p style={{ fontWeight: "bold" }}>({requester.fullName})</p>
              </div>
            </td>
            <td style={{ padding: "12px", verticalAlign: "top" }}>
              <div className="field-row"><span className="field-label">Besarnya Pinjaman</span><span className="field-value">: {formatCurrency(loan.amount)}</span></div>
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontWeight: "bold" }}>Catatan:</p>
                <p>Barang: {String(fd.jenisKebutuhan || "-")} - {String(fd.merek || "")} {String(fd.tipe || "")}</p>
                <p>Tenor: {loan.tenorMonths} bulan</p>
                <p>Angsuran/bulan: {formatCurrency(loan.monthlyInstallment)}</p>
              </div>
              <div style={{ marginTop: "24px" }}>
                <p>Jakarta, ________________</p><p style={{ marginTop: "8px" }}>Menyetujui,</p>
                <div className="signature-space" />
                <p style={{ fontWeight: "bold" }}>({ketuaName})</p><p>Ketua Koperasi Pegawai BKI</p>
              </div>
            </td>
          </tr></tbody>
        </table>
        <Buttons />
      </div>
    );
  }

  return <div style={{ padding: "32px", textAlign: "center" }}>Jenis pinjaman ini tidak memiliki formulir cetak.</div>;
}
