"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";

interface Promotion {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

export default function PromotionsList() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/promotions")
      .then((res) => res.json())
      .then((data) => setPromotions(data.promotions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Promosi & Pengumuman</h2>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <p className="text-gray-500 text-sm">Belum ada promosi saat ini.</p>
      ) : (
        <div className="space-y-3">
          {promotions.map((promo) => (
            <div key={promo.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
              <h3 className="font-medium text-gray-900">{promo.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{promo.description}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
