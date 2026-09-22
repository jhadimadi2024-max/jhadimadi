import React, { useState } from 'react';
import { Language } from '../types';
import { DIVISIONS, DIVISION_DISTRICTS, DISTRICT_UPAZILAS, UPAZILA_MAHALLAS } from '../data/mockData';
import { MapPin, X, Check, Compass } from 'lucide-react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDivision: string;
  setSelectedDivision: (div: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (d: any) => void;
  selectedUpazila: string;
  setSelectedUpazila: (u: string) => void;
  selectedMahalla: string;
  setSelectedMahalla: (m: string) => void;
  lang: Language;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  selectedDivision,
  setSelectedDivision,
  selectedDistrict,
  setSelectedDistrict,
  selectedUpazila,
  setSelectedUpazila,
  selectedMahalla,
  setSelectedMahalla,
  lang,
}) => {
  if (!isOpen) return null;

  const currentDistricts = DIVISION_DISTRICTS[selectedDivision] || ['Rangamati', 'Khagrachhari', 'Bandarban', 'Dhaka', 'Chittagong'];
  const currentUpazilas = DISTRICT_UPAZILAS[selectedDistrict] || ['Sadar'];
  const currentMahallas = UPAZILA_MAHALLAS[selectedUpazila] || ['সব পাড়া/মহল্লা', 'ওয়ার্ড ১', 'ওয়ার্ড ২', 'প্রধান বাজার এলাকা'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Compass className="w-5 h-5 animate-spin-slow text-emerald-400" />
            <h3 className="font-bold text-lg text-white">
              {lang === 'bn' ? 'হাইপারলোকাল লোকেশন নির্বাচন (বিভাগ ➔ জেলা ➔ থানা ➔ পাড়া/মহল্লা)' : 'Hyperlocal Location Filter'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Step 1: Division */}
          <div>
            <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-900/60 border border-emerald-500 text-emerald-300 flex items-center justify-center text-[10px]">১</span>
              {lang === 'bn' ? 'বিভাগ নির্বাচন করুন (Division)' : '1. Select Division'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIVISIONS.map((div) => (
                <button
                  key={div}
                  onClick={() => {
                    setSelectedDivision(div);
                    const dists = DIVISION_DISTRICTS[div] || ['Dhaka'];
                    setSelectedDistrict(dists[0]);
                    const upaz = DISTRICT_UPAZILAS[dists[0]]?.[0] || 'Sadar';
                    setSelectedUpazila(upaz);
                    const mahs = UPAZILA_MAHALLAS[upaz]?.[0] || 'প্রধান এলাকা';
                    setSelectedMahalla(mahs);
                  }}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between cursor-pointer ${
                    selectedDivision === div
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{div.split(' ')[0]}</span>
                  {selectedDivision === div && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: District */}
          <div>
            <label className="block text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-teal-900/60 border border-teal-500 text-teal-300 flex items-center justify-center text-[10px]">২</span>
              {lang === 'bn' ? 'জেলা (District)' : '2. Select District'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentDistricts.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setSelectedDistrict(d);
                    const upaz = DISTRICT_UPAZILAS[d]?.[0] || 'Sadar';
                    setSelectedUpazila(upaz);
                    const mahs = UPAZILA_MAHALLAS[upaz]?.[0] || 'প্রধান এলাকা';
                    setSelectedMahalla(mahs);
                  }}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between cursor-pointer ${
                    selectedDistrict === d
                      ? 'bg-teal-600/30 border-teal-500 text-teal-200'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{d}</span>
                  {selectedDistrict === d && <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Upazila / Thana */}
          <div>
            <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-900/60 border border-cyan-500 text-cyan-300 flex items-center justify-center text-[10px]">৩</span>
              {lang === 'bn' ? 'উপজেলা / থানা (Upazila/Thana)' : '3. Select Upazila/Thana'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
              {currentUpazilas.map((u) => (
                <button
                  key={u}
                  onClick={() => {
                    setSelectedUpazila(u);
                    const mahs = UPAZILA_MAHALLAS[u]?.[0] || 'প্রধান এলাকা';
                    setSelectedMahalla(mahs);
                  }}
                  className={`p-2 rounded-lg text-xs font-medium border text-left flex items-center justify-between cursor-pointer ${
                    selectedUpazila === u
                      ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{u}</span>
                  {selectedUpazila === u && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Para / Mahalla */}
          <div>
            <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-900/60 border border-amber-500 text-amber-300 flex items-center justify-center text-[10px]">৪</span>
              {lang === 'bn' ? 'পাড়া / মহল্লা (Para / Mahalla)' : '4. Select Para / Mahalla'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentMahallas.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMahalla(m)}
                  className={`p-2 rounded-lg text-xs font-medium border text-left flex items-center justify-between cursor-pointer ${
                    selectedMahalla === m
                      ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{m}</span>
                  {selectedMahalla === m && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-200 font-semibold">{selectedDivision.split(' ')[0]} ➔ {selectedDistrict} ➔ {selectedUpazila} ➔ {selectedMahalla}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-950/50"
          >
            {lang === 'bn' ? 'কনফার্ম করুন' : 'Confirm Location'}
          </button>
        </div>
      </div>
    </div>
  );
};

