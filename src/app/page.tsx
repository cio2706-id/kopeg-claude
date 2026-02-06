import Link from "next/link";
import {
  Building2,
  UserPlus,
  LogIn,
  Send,
  Eye,
  ChevronRight,
  ArrowRight,
  PiggyBank,
  Calculator,
  ClipboardList,
  Receipt,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f4f7fe]">
      {/* ── Navigation Bar ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-blue-600" />
            <span className="font-bold text-lg text-gray-900">KopegBKI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">
              Layanan
            </a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">
              Cara Kerja
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/member/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline-block"
            >
              Login Anggota
            </Link>
            <Link
              href="/pengurus/login"
              className="text-sm font-medium bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
            >
              Login Pengurus
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute bottom-0 -left-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.03]" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  KopegBKI
                </h1>
                <p className="text-blue-200 text-sm font-medium">
                  Koperasi Pegawai PT Biro Klasifikasi Indonesia
                </p>
              </div>
            </div>

            <p className="text-lg lg:text-xl text-blue-100 leading-relaxed mb-10 max-w-xl">
              Platform digital untuk layanan simpan pinjam dan pengadaan barang.
              Kelola keuangan, ajukan pinjaman, dan pantau seluruh transaksi
              Anda secara mudah dan transparan.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/member/login"
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-7 py-3.5 rounded-2xl font-semibold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20"
              >
                <LogIn className="w-5 h-5" />
                Login Anggota
              </Link>
              <Link
                href="/pengurus/login"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-7 py-3.5 rounded-2xl font-semibold border border-white/20 hover:bg-white/20 transition-colors"
              >
                Login Pengurus
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features / Services Section ── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
            Layanan Kami
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Semua yang Anda Butuhkan, Dalam Satu Platform
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Simpanan */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
              <PiggyBank className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">Simpanan</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Kelola simpanan pokok, wajib, dan sukarela Anda. Pantau saldo dan
              riwayat mutasi secara real-time.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 group-hover:gap-2 transition-all">
              Lihat Detail <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          {/* Pinjaman */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-5 group-hover:bg-orange-100 transition-colors">
              <Calculator className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">Pinjaman</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Ajukan pinjaman dengan bunga kompetitif. Simulasi angsuran
              sebelum mengajukan untuk perencanaan yang lebih baik.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 group-hover:gap-2 transition-all">
              Lihat Detail <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          {/* Purchase Order */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors">
              <ClipboardList className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">Purchase Order</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Ajukan PO pengadaan barang secara digital. Lacak status
              persetujuan dan pengiriman dengan mudah.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:gap-2 transition-all">
              Lihat Detail <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          {/* Pembayaran */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-5 group-hover:bg-purple-100 transition-colors">
              <Receipt className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">Pembayaran</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Ajukan permintaan pembayaran dan pantau status pencairan.
              Notifikasi otomatis setiap tahap proses.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 group-hover:gap-2 transition-all">
              Lihat Detail <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
            Cara Kerja
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Tiga Langkah Mudah
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mx-auto mb-6 shadow-md shadow-blue-200">
              1
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
              <UserPlus className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">
              Daftar &amp; Login
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Masuk ke portal anggota menggunakan akun Anda atau hubungi
              pengurus untuk pendaftaran.
            </p>
            {/* Connector arrow (hidden on mobile) */}
            <div className="hidden md:block absolute top-1/2 -right-4 z-10">
              <ArrowRight className="w-5 h-5 text-gray-300" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mx-auto mb-6 shadow-md shadow-blue-200">
              2
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
              <Send className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">
              Ajukan Permohonan
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Ajukan simpanan, pinjaman, PO, atau pembayaran melalui
              formulir digital yang mudah diisi.
            </p>
            {/* Connector arrow (hidden on mobile) */}
            <div className="hidden md:block absolute top-1/2 -right-4 z-10">
              <ArrowRight className="w-5 h-5 text-gray-300" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mx-auto mb-6 shadow-md shadow-blue-200">
              3
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
              <Eye className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">
              Pantau Status
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Lacak progres permohonan Anda secara real-time. Dapatkan
              notifikasi setiap ada pembaruan status.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-10 lg:p-14 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5" />

          <div className="relative">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Siap Memulai?
            </h2>
            <p className="text-blue-100 mb-8 max-w-md mx-auto">
              Akses layanan koperasi kapan saja dan di mana saja melalui
              platform digital KopegBKI.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/member/login"
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-7 py-3.5 rounded-2xl font-semibold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20"
              >
                <LogIn className="w-5 h-5" />
                Login Anggota
              </Link>
              <Link
                href="/pengurus/login"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-7 py-3.5 rounded-2xl font-semibold border border-white/20 hover:bg-white/20 transition-colors"
              >
                Login Pengurus
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-gray-900">KopegBKI</span>
            </div>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Koperasi Pegawai PT Biro
              Klasifikasi Indonesia. Hak cipta dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
