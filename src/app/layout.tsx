import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KOPEG BKI - Koperasi Pegawai PT Biro Klasifikasi Indonesia",
  description:
    "Sistem informasi koperasi pegawai untuk layanan simpan pinjam PT Biro Klasifikasi Indonesia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
