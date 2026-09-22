import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Crosshair,
  Navigation,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Plus,
  Minus
} from 'lucide-react';

export interface GoogleMapLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  idPrefix?: string;
  defaultLat?: number;
  defaultLng?: number;
  district?: string;
  upazila?: string;
  label?: string;
  required?: boolean;
}

// Default center: Khagrachhari / CHT Region
const DEFAULT_CHT_LAT = 23.1193;
const DEFAULT_CHT_LNG = 91.9847;

// Approximate coordinates for CHT & Key Districts
const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'খাগড়াছড়ি': { lat: 23.1193, lng: 91.9847 },
  'Khagrachhari': { lat: 23.1193, lng: 91.9847 },
  'রাঙ্গামাটি': { lat: 22.6533, lng: 92.1753 },
  'Rangamati': { lat: 22.6533, lng: 92.1753 },
  'বান্দরবান': { lat: 22.1953, lng: 92.2184 },
  'Bandarban': { lat: 22.1953, lng: 92.2184 },
  'চট্টগ্রাম': { lat: 22.3569, lng: 91.7832 },
  'Chittagong': { lat: 22.3569, lng: 91.7832 },
  'ঢাকা': { lat: 23.8103, lng: 90.4125 },
  'Dhaka': { lat: 23.8103, lng: 90.4125 },
};

// Placeholder string for Google Maps API key configuration
export const GOOGLE_MAPS_API_KEY_PLACEHOLDER = 'YOUR_API_KEY';

export const GoogleMapLocationPicker: React.FC<GoogleMapLocationPickerProps> = ({
  latitude,
  longitude,
  onChange,
  idPrefix = 'reg-map',
  defaultLat = DEFAULT_CHT_LAT,
  defaultLng = DEFAULT_CHT_LNG,
  district,
  upazila,
  label = 'ইন্টারেক্টিভ গুগল ম্যাপে আপনার সুনির্দিষ্ট অবস্থান পিন করুন *',
  required = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const googleMapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  const [currentLat, setCurrentLat] = useState<number>(latitude ?? defaultLat);
  const [currentLng, setCurrentLng] = useState<number>(longitude ?? defaultLng);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(13);

  // Sync with prop changes
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      setCurrentLat(latitude);
      setCurrentLng(longitude);
    }
  }, [latitude, longitude]);

  // Adjust center if district changes and user has not yet customized position
  useEffect(() => {
    if (district && DISTRICT_COORDINATES[district] && (latitude === null || latitude === defaultLat)) {
      const coords = DISTRICT_COORDINATES[district];
      setCurrentLat(coords.lat);
      setCurrentLng(coords.lng);
      onChange(coords.lat, coords.lng);
      if (googleMapInstanceRef.current) {
        googleMapInstanceRef.current.panTo({ lat: coords.lat, lng: coords.lng });
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setPosition({ lat: coords.lat, lng: coords.lng });
        }
      }
    }
  }, [district]);

  // Notify parent on initial load if not set
  useEffect(() => {
    if (latitude === null || longitude === null) {
      onChange(currentLat, currentLng);
    }
  }, []);

  // Initialize or check Google Maps API
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
        setIsGoogleMapsReady(true);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) return;

    // Set callback if script is loading
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

  // Render Google Map if available
  useEffect(() => {
    if (!isGoogleMapsReady || !mapContainerRef.current) return;

    const gmaps = (window as any).google?.maps;
    if (!gmaps) return;

    try {
      const mapOptions = {
        center: { lat: currentLat, lng: currentLng },
        zoom: zoomLevel,
        mapTypeId: gmaps.MapTypeId.ROADMAP,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        zoomControl: true,
      };

      const map = new gmaps.Map(mapContainerRef.current, mapOptions);
      googleMapInstanceRef.current = map;

      // Draggable Marker
      const marker = new gmaps.Marker({
        position: { lat: currentLat, lng: currentLng },
        map: map,
        draggable: true,
        animation: gmaps.Animation.DROP,
        title: 'আপনার চিহ্নিত অবস্থান (টেনে সরিয়ে সঠিক জায়গায় রাখুন)'
      });
      markerInstanceRef.current = marker;

      // Marker Drag Event
      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (pos) {
          const lat = parseFloat(pos.lat().toFixed(6));
          const lng = parseFloat(pos.lng().toFixed(6));
          setCurrentLat(lat);
          setCurrentLng(lng);
          onChange(lat, lng);
          setLocationStatus(`চিহ্নিত অবস্থান আপডেট হয়েছে: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`);
          setStatusType('success');
        }
      });

      // Map Click Event to move marker
      map.addListener('click', (e: any) => {
        if (e && e.latLng) {
          const lat = parseFloat(e.latLng.lat().toFixed(6));
          const lng = parseFloat(e.latLng.lng().toFixed(6));
          marker.setPosition(e.latLng);
          setCurrentLat(lat);
          setCurrentLng(lng);
          onChange(lat, lng);
          setLocationStatus(`ম্যাপে ক্লিক করে পিন স্থাপন করা হয়েছে: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`);
          setStatusType('success');
        }
      });
    } catch (err) {
      console.warn('Google Maps initialization fallback notice:', err);
    }
  }, [isGoogleMapsReady]);

  // "Use My Current GPS Location" button handler using navigator.geolocation
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('আপনার ব্রাউজার বা ডিভাইসে জিপিএস লোকেশন সাপোর্ট নেই।');
      setStatusType('error');
      return;
    }

    setIsLocating(true);
    setLocationStatus('আপনার বর্তমান জিপিএস লোকেশন শনাক্ত করা হচ্ছে...');
    setStatusType('info');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        setCurrentLat(lat);
        setCurrentLng(lng);
        onChange(lat, lng);
        setIsLocating(false);
        setLocationStatus(`✅ আপনার বর্তমান জিপিএস লোকেশন গৃহীত হয়েছে: ${lat}° N, ${lng}° E`);
        setStatusType('success');

        // Pan Google Map & move marker if available
        if (googleMapInstanceRef.current) {
          googleMapInstanceRef.current.panTo({ lat, lng });
          googleMapInstanceRef.current.setZoom(16);
        }
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setPosition({ lat, lng });
        }
      },
      (error) => {
        setIsLocating(false);
        let msg = 'জিপিএস লোকেশন পেতে সমস্যা হয়েছে।';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'লোকেশন পারমিশন দেওয়া হয়নি। আপনি ম্যাপের পিনটি টেনে আপনার অবস্থানে রাখুন।';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'ডিভাইসের অবস্থান পাওয়া যায়নি। ম্যাপে সরাসরি ক্লিক করে পিন বসান।';
        } else if (error.code === error.TIMEOUT) {
          msg = 'জিপিএস অনুরোধের সময় উত্তীর্ণ হয়েছে। পুনরায় চেষ্টা করুন।';
        }
        setLocationStatus(msg);
        setStatusType('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onChange]);

  // Handle fallback interactive map dragging/clicking
  const handleInteractiveMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isGoogleMapsReady && googleMapInstanceRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalized offset relative to center
    const xOffset = (x - rect.width / 2) / (rect.width / 2);
    const yOffset = (y - rect.height / 2) / (rect.height / 2);

    const deltaLat = -yOffset * (0.05 / Math.pow(1.5, zoomLevel - 12));
    const deltaLng = xOffset * (0.05 / Math.pow(1.5, zoomLevel - 12));

    const newLat = parseFloat((currentLat + deltaLat).toFixed(6));
    const newLng = parseFloat((currentLng + deltaLng).toFixed(6));

    setCurrentLat(newLat);
    setCurrentLng(newLng);
    onChange(newLat, newLng);
    setLocationStatus(`পিন স্থাপন করা হয়েছে: ${newLat}° N, ${newLng}° E`);
    setStatusType('success');
  };

  return (
    <div className="bg-white border-2 border-emerald-500/80 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
      
      {/* Hidden inputs for latitude and longitude as strictly required */}
      <input
        type="hidden"
        name="latitude"
        id={`${idPrefix}-lat`}
        value={currentLat !== null ? currentLat : ''}
      />
      <input
        type="hidden"
        name="longitude"
        id={`${idPrefix}-lng`}
        value={currentLng !== null ? currentLng : ''}
      />

      {/* Header & Label */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <label className="block text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin size={22} className="text-emerald-700 shrink-0" />
            <span>{label}</span>
          </label>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5">
            পণ্য ডেলিভারি, জরুরি রক্তের সন্ধান বা গ্রাহকদের সরাসরি আপনার লোকেশন দেখানোর জন্য ম্যাপের পিনটি টেনে রাখুন
          </p>
        </div>
      </div>

      {/* "Use My Current GPS Location" Button Above the Map (Strict Requirement) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <button
          type="button"
          id={`${idPrefix}-gps-btn`}
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold text-sm sm:text-base rounded-2xl shadow-sm hover:shadow-md transition active:scale-98 cursor-pointer"
          title="Use My Current GPS Location"
        >
          {isLocating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>লোকেশন খোঁজা হচ্ছে...</span>
            </>
          ) : (
            <>
              <Crosshair size={20} className="stroke-[2.5]" />
              <span>আমার বর্তমান জিপিএস লোকেশন ব্যবহার করুন (Use My GPS Location)</span>
            </>
          )}
        </button>

        {/* Coordinate Display Badge */}
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-950 flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <span className="text-gray-500 font-sans font-medium text-[11px]">স্থানাঙ্ক (GPS):</span>
          <span className="text-emerald-800">
            {currentLat.toFixed(5)}°N, {currentLng.toFixed(5)}°E
          </span>
        </div>
      </div>

      {/* Feedback Alert / Status Banner */}
      {locationStatus && (
        <div
          className={`p-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition ${
            statusType === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : statusType === 'error'
              ? 'bg-amber-50 text-amber-900 border border-amber-300'
              : 'bg-blue-50 text-blue-900 border border-blue-200'
          }`}
        >
          {statusType === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-amber-700 shrink-0" />
          )}
          <span className="flex-1">{locationStatus}</span>
        </div>
      )}

      {/* Interactive Map Container */}
      <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border-2 border-emerald-300 bg-slate-100 shadow-inner group select-none">
        
        {/* Google Maps Viewport Container */}
        <div
          ref={mapContainerRef}
          id={`${idPrefix}-viewport`}
          className="w-full h-full"
        />

        {/* Fallback Interactive Visual Surface if Google Maps is loading or using placeholder key */}
        {(!isGoogleMapsReady || !(window as any).google?.maps) && (
          <div
            onClick={handleInteractiveMapClick}
            className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center cursor-crosshair overflow-hidden"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(16, 185, 129, 0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(16, 185, 129, 0.08) 1px, transparent 1px),
                radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, rgba(241, 245, 249, 0.95) 70%)
              `,
              backgroundSize: '28px 28px, 28px 28px, 100% 100%'
            }}
          >
            {/* Draggable Visual Marker Pin */}
            <div className="relative flex flex-col items-center -mt-8 pointer-events-none animate-bounce">
              <div className="bg-red-600 text-white p-2 rounded-full shadow-xl border-2 border-white">
                <MapPin size={24} className="fill-white" />
              </div>
              <div className="w-2.5 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5"></div>
              <span className="mt-1 bg-gray-900/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                আপনার অবস্থান (ট্যাপ বা ড্র্যাগ করুন)
              </span>
            </div>

            {/* Instruction Overlay */}
            <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-xs p-2 rounded-xl text-center border border-emerald-200 pointer-events-none">
              <p className="text-xs font-bold text-gray-800">
                ম্যাপে সরাসরি ক্লিক করুন অথবা উপরের "আমার বর্তমান জিপিএস লোকেশন" বাটনে চাপুন
              </p>
              <p className="text-[11px] text-gray-500">
                Google Maps API Placeholder ({GOOGLE_MAPS_API_KEY_PLACEHOLDER}) স্বয়ংক্রিয়ভাবে সক্রিয় রয়েছে
              </p>
            </div>
          </div>
        )}

        {/* Map Control Hints & Zoom Controls */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
          <button
            type="button"
            onClick={() => {
              setZoomLevel((z) => Math.min(z + 1, 19));
              if (googleMapInstanceRef.current) {
                googleMapInstanceRef.current.setZoom(googleMapInstanceRef.current.getZoom() + 1);
              }
            }}
            className="w-8 h-8 bg-white hover:bg-gray-100 text-gray-800 rounded-lg shadow-md flex items-center justify-center font-bold text-base cursor-pointer border border-gray-300"
            title="Zoom in"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoomLevel((z) => Math.max(z - 1, 8));
              if (googleMapInstanceRef.current) {
                googleMapInstanceRef.current.setZoom(googleMapInstanceRef.current.getZoom() - 1);
              }
            }}
            className="w-8 h-8 bg-white hover:bg-gray-100 text-gray-800 rounded-lg shadow-md flex items-center justify-center font-bold text-base cursor-pointer border border-gray-300"
            title="Zoom out"
          >
            <Minus size={18} />
          </button>
        </div>

        {/* Direct Link to Google Maps */}
        <div className="absolute bottom-2 right-2 z-10">
          <a
            href={`https://www.google.com/maps?q=${currentLat},${currentLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/95 hover:bg-white text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-sm transition"
          >
            <Navigation size={12} />
            <span>গুগল ম্যাপে বড় দেখুন</span>
          </a>
        </div>
      </div>

      {/* Helpful Quick Presets (Khagrachhari, Rangamati, Bandarban, Chittagong, Dhaka) */}
      <div className="pt-1 flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-bold text-gray-500">দ্রুত এলাকা বাছুন:</span>
        {Object.entries(DISTRICT_COORDINATES).slice(0, 5).map(([name, coords]) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setCurrentLat(coords.lat);
              setCurrentLng(coords.lng);
              onChange(coords.lat, coords.lng);
              if (googleMapInstanceRef.current) {
                googleMapInstanceRef.current.panTo({ lat: coords.lat, lng: coords.lng });
              }
              if (markerInstanceRef.current) {
                markerInstanceRef.current.setPosition({ lat: coords.lat, lng: coords.lng });
              }
            }}
            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-emerald-100 text-gray-800 hover:text-emerald-900 border border-gray-300 transition cursor-pointer"
          >
            {name}
          </button>
        ))}
      </div>

    </div>
  );
};

export default GoogleMapLocationPicker;
