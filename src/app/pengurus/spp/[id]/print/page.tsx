"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

interface SppDetail {
  sppNumber: string;
  unitKerja: string;
  requestDate: string;
  payableTo: string;
  totalAmount: string;
  amountInWords: string | null;
  supportingDocs: string | null;
  hasPph23: boolean;
  totalInvoice: string | null;
  pphDue: string | null;
  status: string;
  approvedByTreasury: string | null;
  approvedByTreasuryAt: string | null;
  approvedByManager: string | null;
  approvedByManagerAt: string | null;
  approvedByBendahara: string | null;
  approvedByBendaharaAt: string | null;
  creatorName: string;
}

interface SppItemRecord {
  accountCode: string;
  description: string;
  amount: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function SppPrintPage() {
  const [sppData, setSppData] = useState<SppDetail | null>(null);
  const [items, setItems] = useState<SppItemRecord[]>([]);
  const [approverNames, setApproverNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const sppId = params.id as string;

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/spp/${sppId}`);
      if (res.ok) {
        const data = await res.json();
        setSppData(data.spp);
        setItems(data.items || []);
        setApproverNames(data.approverNames || {});
      }
    } catch (error) {
      console.error("Failed to load:", error);
    } finally {
      setLoading(false);
    }
  }, [sppId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!loading && sppData) {
      // Auto-trigger print after data loads
      setTimeout(() => window.print(), 500);
    }
  }, [loading, sppData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Memuat dokumen...</p>
      </div>
    );
  }

  if (!sppData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>SPP tidak ditemukan</p>
      </div>
    );
  }

  const treasuryName = sppData.approvedByTreasury ? approverNames[sppData.approvedByTreasury] || "—" : "";
  const managerName = sppData.approvedByManager ? approverNames[sppData.approvedByManager] || "—" : "";
  const bendaharaName = sppData.approvedByBendahara ? approverNames[sppData.approvedByBendahara] || "—" : "";

  return (
    <>
      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 15mm 20mm; }
        }
        body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; }
        table { border-collapse: collapse; width: 100%; }
        .spp-table th, .spp-table td { border: 1px solid #000; padding: 4px 8px; }
        .spp-table th { background: #f0f0f0; text-align: center; font-weight: bold; }
        .signature-line { border-bottom: 1px solid #000; min-width: 180px; display: inline-block; margin-top: 60px; }
      `}</style>

      {/* Print button */}
      <div className="no-print" style={{ padding: "16px", textAlign: "center", background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
        <button
          onClick={() => window.print()}
          style={{ padding: "10px 24px", background: "#14b8a6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontFamily: "sans-serif" }}
        >
          Cetak / Simpan PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{ padding: "10px 24px", background: "#e5e5e5", color: "#333", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontFamily: "sans-serif", marginLeft: "8px" }}
        >
          Tutup
        </button>
      </div>

      <div style={{ maxWidth: "210mm", margin: "0 auto", padding: "20mm" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "14pt", fontWeight: "bold" }}>
            KOPERASI PEGAWAI BIRO KLASIFIKASI INDONESIA
          </h2>
          <h3 style={{ margin: "8px 0 0 0", fontSize: "13pt", fontWeight: "bold", textDecoration: "underline" }}>
            PERMINTAAN PEMBAYARAN
          </h3>
        </div>

        {/* Info Fields */}
        <table style={{ width: "100%", marginBottom: "16px" }}>
          <tbody>
            <tr>
              <td style={{ width: "30%", padding: "3px 0" }}>No. SPP</td>
              <td style={{ padding: "3px 0" }}>: {sppData.sppNumber}</td>
            </tr>
            <tr>
              <td style={{ padding: "3px 0" }}>Unit Kerja</td>
              <td style={{ padding: "3px 0" }}>: {sppData.unitKerja}</td>
            </tr>
            <tr>
              <td style={{ padding: "3px 0" }}>Tanggal Permintaan</td>
              <td style={{ padding: "3px 0" }}>: {formatDate(sppData.requestDate)}</td>
            </tr>
            <tr>
              <td style={{ padding: "3px 0" }}>Dibayarkan Kepada</td>
              <td style={{ padding: "3px 0" }}>: {sppData.payableTo}</td>
            </tr>
            <tr>
              <td style={{ padding: "3px 0" }}>Jumlah</td>
              <td style={{ padding: "3px 0", fontWeight: "bold" }}>: Rp {formatCurrency(Number(sppData.totalAmount)).replace("Rp", "").trim()}</td>
            </tr>
            <tr>
              <td style={{ padding: "3px 0" }}>Bukti-bukti pembayaran</td>
              <td style={{ padding: "3px 0" }}>: {sppData.supportingDocs || "Terlampir"}</td>
            </tr>
          </tbody>
        </table>

        {/* Items Table */}
        <table className="spp-table" style={{ marginBottom: "16px" }}>
          <thead>
            <tr>
              <th style={{ width: "15%" }}>No. Akun</th>
              <th>Keterangan Pembayaran</th>
              <th style={{ width: "25%", textAlign: "right" }}>Jumlah (Rp.)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: "center", fontFamily: "monospace" }}>{item.accountCode}</td>
                <td>{item.description}</td>
                <td style={{ textAlign: "right" }}>{Number(item.amount).toLocaleString("id-ID")}</td>
              </tr>
            ))}
            {/* Empty rows for padding if < 5 items */}
            {items.length < 5 && Array.from({ length: 5 - items.length }).map((_, idx) => (
              <tr key={`empty-${idx}`}>
                <td style={{ height: "24px" }}>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} style={{ textAlign: "right", fontWeight: "bold", padding: "6px 8px" }}>TOTAL</td>
              <td style={{ textAlign: "right", fontWeight: "bold", padding: "6px 8px" }}>
                {Number(sppData.totalAmount).toLocaleString("id-ID")}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* PPh 23 */}
        {sppData.hasPph23 && (
          <table style={{ marginBottom: "16px", width: "60%" }}>
            <tbody>
              <tr>
                <td style={{ padding: "3px 0" }}>Total Tagihan</td>
                <td style={{ textAlign: "right", padding: "3px 0" }}>
                  {Number(sppData.totalInvoice || 0).toLocaleString("id-ID")}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0" }}>PPh 23 (Harus Bayar)</td>
                <td style={{ textAlign: "right", padding: "3px 0", fontWeight: "bold" }}>
                  {Number(sppData.pphDue || 0).toLocaleString("id-ID")}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Terbilang */}
        {sppData.amountInWords && (
          <p style={{ marginBottom: "24px" }}>
            <strong>Terbilang :</strong> <em>{sppData.amountInWords}</em>
          </p>
        )}

        {/* Signatures */}
        <table style={{ width: "100%", marginTop: "40px" }}>
          <tbody>
            <tr style={{ textAlign: "center" }}>
              <td style={{ width: "33%", verticalAlign: "top" }}>
                <p style={{ margin: 0 }}>Dibuat tgl.</p>
                <p style={{ margin: "2px 0", fontSize: "10pt" }}>
                  {sppData.approvedByTreasuryAt ? formatDate(sppData.approvedByTreasuryAt) : ""}
                </p>
              </td>
              <td style={{ width: "33%", verticalAlign: "top" }}>
                <p style={{ margin: 0 }}>Mengetahui</p>
              </td>
              <td style={{ width: "33%", verticalAlign: "top" }}>
                <p style={{ margin: 0 }}>Verifikasi tgl.</p>
                <p style={{ margin: "2px 0", fontSize: "10pt" }}>
                  {sppData.approvedByBendaharaAt ? formatDate(sppData.approvedByBendaharaAt) : ""}
                </p>
              </td>
            </tr>
            <tr style={{ textAlign: "center" }}>
              <td style={{ paddingTop: "70px" }}>
                <div style={{ borderBottom: "1px solid #000", width: "80%", margin: "0 auto 4px" }}></div>
                <p style={{ margin: 0, fontWeight: "bold" }}>{treasuryName || "(Staf Treasury)"}</p>
                <p style={{ margin: 0, fontSize: "10pt" }}>Staf Treasury</p>
              </td>
              <td style={{ paddingTop: "70px" }}>
                <div style={{ borderBottom: "1px solid #000", width: "80%", margin: "0 auto 4px" }}></div>
                <p style={{ margin: 0, fontWeight: "bold" }}>{managerName || "(Manager)"}</p>
                <p style={{ margin: 0, fontSize: "10pt" }}>Manager</p>
              </td>
              <td style={{ paddingTop: "70px" }}>
                <div style={{ borderBottom: "1px solid #000", width: "80%", margin: "0 auto 4px" }}></div>
                <p style={{ margin: 0, fontWeight: "bold" }}>{bendaharaName || "(Bendahara)"}</p>
                <p style={{ margin: 0, fontSize: "10pt" }}>Bendahara</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
