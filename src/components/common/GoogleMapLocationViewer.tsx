import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

export interface GoogleMapLocationViewerProps {
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
  subtitle?: string;
  zoom?: number;
}

export const GoogleMapLocationViewer: React.FC<GoogleMapLocationViewerProps> = ({
  latitude = 23.1193,
  longitude = 91.9847,
  title = 'নিবন্ধিত ভৌগোলিক অবস্থান (Google Map Location)',
  subtitle,
  zoom = 15
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);

  const safeLat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : 23.1193;
  const safeLng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : 91.9847;

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
        setIsGoogleMapsReady(true);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) return;

    (window as any).__googleMapsLoadedCallback = () => {
      setIsGoogleMapsReady(true);
    };

    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isGoogleMapsReady || !mapContainerRef.current) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps) return;

    try {
      const map = new gmaps.Map(mapContainerRef.current, {
        center: { lat: safeLat, lng: safeLng },
        zoom: zoom,
        mapTypeId: gmaps.MapTypeId.ROADMAP,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      new gmaps.Marker({
        position: { lat: safeLat, lng: safeLng },
        map: map,
        title: title,
        animation: gmaps.Animation.DROP
      });
    } catch (err) {
      console.warn('GoogleMapLocationViewer notice:', err);
    }
  }, [isGoogleMapsReady, safeLat, safeLng, zoom]);

  const mapsUrl = `https://www.google.com/maps?q=${safeLat},${safeLng}`;

  return (
    <div className="bg-white border-2 border-emerald-300 rounded-3xl p-4 sm:p-5 space-y-3 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
            <MapPin size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-base sm:text-lg">{title}</h4>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold rounded-xl border border-emerald-300 transition"
        >
          <ExternalLink size={14} />
          <span>গুগল ম্যাপে দেখুন</span>
        </a>
      </div>

      {/* Map Viewport */}
      <div className="relative w-full h-60 sm:h-72 rounded-2xl overflow-hidden border border-emerald-200 bg-slate-100 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Fallback Display if Google Maps is loading or using placeholder */}
        {(!isGoogleMapsReady || !(window as any).google?.maps) && (
          <div
            className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-4 text-center"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(16, 185, 129, 0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(16, 185, 129, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px'
            }}
          >
            <div className="bg-red-600 text-white p-3 rounded-full shadow-lg border-2 border-white mb-2">
              <MapPin size={26} className="fill-white" />
            </div>
            <p className="font-bold text-gray-900 text-sm sm:text-base">সংরক্ষিত সুনির্দিষ্ট ভৌগোলিক অবস্থান</p>
            <p className="text-xs font-mono font-bold text-emerald-800 mt-1">
              অক্ষাংশ: {safeLat.toFixed(5)}° N | দ্রাঘিমাংশ: {safeLng.toFixed(5)}° E
            </p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Navigation size={14} />
              <span>গুগল ম্যাপে নেভিগেশন চালু করুন</span>
            </a>
          </div>
        )}
      </div>

      {/* Coordinate & Directions Footer */}
      <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
        <span className="font-mono font-semibold">
          GPS Coordinates: {safeLat.toFixed(6)}, {safeLng.toFixed(6)}
        </span>
        <span className="font-medium text-emerald-700">সংরক্ষিত অবস্থান পিন করা রয়েছে</span>
      </div>
    </div>
  );
};

export default GoogleMapLocationViewer;
