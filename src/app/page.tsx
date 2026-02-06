import Navbar from "@/components/Navbar";
import InfoBanner from "@/components/InfoBanner";
import PromotionsList from "@/components/PromotionsList";
import Calendar from "@/components/Calendar";
import PaymentRequestForm from "@/components/PaymentRequestForm";
import { Building2, Users, Wallet, CreditCard, Shield } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <InfoBanner />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">KOPEG BKI</h1>
                <p className="text-blue-200 text-sm">
                  Koperasi Pegawai PT Biro Klasifikasi Indonesia
                </p>
              </div>
            </div>
            <p className="text-lg text-blue-100 mb-8">
              Layanan simpan pinjam untuk kesejahteraan anggota. Kelola
              simpanan, ajukan pinjaman, dan pantau status permintaan Anda
              secara online.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/member/login"
                className="bg-white text-blue-700 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
              >
                Login Anggota
              </Link>
              <Link
                href="/payment-tracker"
                className="border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition"
              >
                Lacak Pembayaran
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            {
              icon: <Users className="w-6 h-6 text-blue-600" />,
              title: "Keanggotaan",
              desc: "Kelola data anggota koperasi dengan mudah",
            },
            {
              icon: <Wallet className="w-6 h-6 text-green-600" />,
              title: "Simpanan",
              desc: "Simpanan pokok, wajib, dan sukarela",
            },
            {
              icon: <CreditCard className="w-6 h-6 text-orange-600" />,
              title: "Pinjaman",
              desc: "Ajukan pinjaman dengan bunga kompetitif",
            },
            {
              icon: <Shield className="w-6 h-6 text-purple-600" />,
              title: "Transparent",
              desc: "Lacak status persetujuan secara real-time",
            },
          ].map((feature, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-5">
              <div className="mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PromotionsList />
            <Calendar />
          </div>
          <div>
            <PaymentRequestForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Koperasi Pegawai PT Biro
            Klasifikasi Indonesia
          </p>
          <p className="text-xs mt-1">
            Jl. Yos Sudarso No.38-40, Jakarta Utara
          </p>
        </div>
      </footer>
    </div>
  );
}
