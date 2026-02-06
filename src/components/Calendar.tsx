"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventDate: string;
  eventType?: string;
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((data) => setEvents(data.events || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Kalender Kegiatan</h2>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-gray-500 text-sm">Belum ada kegiatan terjadwal.</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition">
              <div className="bg-blue-100 text-blue-700 rounded px-2 py-1 text-xs font-medium min-w-[80px] text-center">
                {format(new Date(event.eventDate), "dd MMM yyyy", { locale: id })}
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                {event.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
