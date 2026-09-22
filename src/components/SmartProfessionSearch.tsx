import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Check, Briefcase, X } from 'lucide-react';
import { ALL_PROFESSIONS_FLAT_LIST, MASTER_PROFESSION_CATEGORIES } from '../data/professionsMasterData';
import { Language } from '../types';

interface SmartProfessionSearchProps {
  value: string;
  onChange: (profession: string) => void;
  lang?: Language;
  required?: boolean;
}

export const SmartProfessionSearch: React.FC<SmartProfessionSearchProps> = ({
  value,
  onChange,
  lang = 'bn',
  required = true
}) => {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with incoming value if changed externally
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered professions matching query
  const filteredProfessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default top recommended / diverse local occupations
      return ALL_PROFESSIONS_FLAT_LIST.slice(0, 15);
    }

    // Match by Bengali name, English category, or related keywords
    return ALL_PROFESSIONS_FLAT_LIST.filter(item => {
      const name = item.name.toLowerCase();
      const catBn = item.category.toLowerCase();
      const catEn = item.categoryEn.toLowerCase();

      // Transliteration / keyword helpers
      let matchesKeyword = false;
      if (q.includes('driver') || q.includes('ড্রাইভার') || q.includes('গাড়ি')) {
        matchesKeyword = name.includes('ড্রাইভার') || name.includes('চালক') || name.includes('রাইডার');
      } else if (q.includes('electric') || q.includes('কারেন্ট') || q.includes('ইলেকট্রিক')) {
        matchesKeyword = name.includes('ইলেকট্রিশিয়ান') || name.includes('টেকনিশিয়ান');
      } else if (q.includes('kazi') || q.includes('কাজী') || q.includes('বিবাহ') || q.includes('বিয়ে') || q.includes('রেজিস্ট্রার')) {
        matchesKeyword = name.includes('কাজী') || name.includes('রেজিস্ট্রার') || name.includes('বিবাহ') || name.includes('ঘটক');
      } else if (q.includes('imam') || q.includes('ইমাম') || q.includes('খতিব') || q.includes('মসজিদ')) {
        matchesKeyword = name.includes('ইমাম') || name.includes('খতিব') || name.includes('মুয়াজ্জিন');
      } else if (q.includes('priest') || q.includes('পুরোহিত') || q.includes('ঠাকুর') || q.includes('পূজা')) {
        matchesKeyword = name.includes('পুরোহিত') || name.includes('ঠাকুর') || name.includes('পূজা');
      } else if (q.includes('monk') || q.includes('ভিক্ষু') || q.includes('ভান্তে') || q.includes('বৌদ্ধ')) {
        matchesKeyword = name.includes('ভিক্ষু') || name.includes('ভান্তে') || name.includes('আচার্য');
      } else if (q.includes('pastor') || q.includes('পাদ্রী') || q.includes('যাজক') || q.includes('খ্রিস্টান')) {
        matchesKeyword = name.includes('যাজক') || name.includes('পাস্টর') || name.includes('ফাদার');
      } else if (q.includes('plumb') || q.includes('পাইপ') || q.includes('স্যানিটারি')) {
        matchesKeyword = name.includes('প্লাম্বার') || name.includes('স্যানিটারি') || name.includes('পাইপ');
      } else if (q.includes('tutor') || q.includes('শিক্ষক') || q.includes('মাস্টার') || q.includes('টিচার')) {
        matchesKeyword = name.includes('টিউটর') || name.includes('শিক্ষক') || name.includes('মেন্টর');
      }

      return name.includes(q) || catBn.includes(q) || catEn.includes(q) || matchesKeyword;
    }).slice(0, 20);
  }, [query]);

  // Check if query exactly matches any profession
  const hasExactMatch = useMemo(() => {
    return ALL_PROFESSIONS_FLAT_LIST.some(
      p => p.name.trim().toLowerCase() === query.trim().toLowerCase()
    );
  }, [query]);

  const handleSelect = (professionName: string) => {
    setQuery(professionName);
    onChange(professionName);
    setIsOpen(false);
  };

  const handleCustomAdd = () => {
    if (query.trim()) {
      onChange(query.trim());
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredProfessions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredProfessions[highlightedIndex]) {
        handleSelect(filteredProfessions[highlightedIndex].name);
      } else if (query.trim()) {
        handleCustomAdd();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative space-y-1" ref={containerRef}>
      <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-[#0A6A32]" />
          <span>{lang === 'bn' ? 'মূল পেশা / দক্ষতার বিষয় (১,০০০+ তালিকাভুক্ত) *' : 'Main Profession / Skill Category (1,000+ Listed) *'}</span>
        </span>
        <span className="text-[10px] text-gray-400 font-normal">
          {lang === 'bn' ? 'টাইপ করে খুঁজুন বা নির্বাচন করুন' : 'Search or Select'}
        </span>
      </label>

      {/* Input container */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search className="w-4 h-4 text-emerald-700" />
        </div>

        <input
          ref={inputRef}
          type="text"
          required={required}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            lang === 'bn'
              ? 'যেমন: ইলেকট্রিশিয়ান, ড্রাইভার, কাজী, ইমাম, পুরোহিত, প্লাম্বার...'
              : 'e.g. Electrician, Driver, Kazi, Imam, Priest, Plumber...'
          }
          className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:border-[#0A6A32] focus:ring-1 focus:ring-[#0A6A32] outline-none transition shadow-2xs"
          id="input-smart-profession"
          autoComplete="off"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange('');
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
            title={lang === 'bn' ? 'মুছুন' : 'Clear'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick Category Chips for Fast Discovery */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar text-[10px]">
        <span className="text-gray-400 shrink-0 font-medium">{lang === 'bn' ? 'জনপ্রিয়:' : 'Popular:'}</span>
        {[
          { label: lang === 'bn' ? 'ইলেকট্রিশিয়ান' : 'Electrician', val: 'ইলেকট্রিশিয়ান (বাসাবাড়ি ওয়্যারিং)' },
          { label: lang === 'bn' ? 'কার ড্রাইভার' : 'Car Driver', val: 'প্রাইভেট কার ও মাইক্রোবাস ড্রাইভার (ব্যক্তিগত/দৈনিক)' },
          { label: lang === 'bn' ? 'কাজী (বিবাহ রেজিস্ট্রার)' : 'Kazi (Registrar)', val: 'কাজী / নিকাহ ও তালাক রেজিস্ট্রার (Kazi / Muslim Marriage Registrar)' },
          { label: lang === 'bn' ? 'ইমাম ও খতিব' : 'Imam & Khatib', val: 'মসজিদের খতিব ও পেশ ইমাম (Islamic Scholar / Imam)' },
          { label: lang === 'bn' ? 'পূজা পুরোহিত' : 'Purohit / Priest', val: 'হিন্দু পূজা ও বিবাহ পুরোহিত / ঠাকুর (Hindu Purohit / Priest)' },
          { label: lang === 'bn' ? 'প্লাম্বার' : 'Plumber', val: 'প্লাম্বার ও স্যানিটারি মিস্ত্রি' },
          { label: lang === 'bn' ? 'হোম টিউটর' : 'Home Tutor', val: 'হোম টিউটর (ক্লাস ১-৫ সকল বিষয়)' },
        ].map((chip) => (
          <button
            key={chip.val}
            type="button"
            onClick={() => handleSelect(chip.val)}
            className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#0A6A32] border border-emerald-200 transition cursor-pointer font-medium"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div 
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-72 overflow-y-auto divide-y divide-gray-100 text-xs animate-in fade-in duration-150"
          id="dropdown-profession-suggestions"
        >
          {/* Custom Add Option if query doesn't exactly match */}
          {query.trim().length > 1 && !hasExactMatch && (
            <div
              onClick={handleCustomAdd}
              className="p-3 bg-amber-50/80 hover:bg-amber-100/90 text-amber-900 flex items-center justify-between cursor-pointer transition border-b border-amber-200"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-xs">
                    {lang === 'bn' ? 'কাস্টম পেশা হিসেবে যোগ করুন:' : 'Add as Custom Profession:'}
                  </p>
                  <p className="text-[11px] text-amber-800 font-semibold italic">"{query.trim()}"</p>
                </div>
              </div>
              <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold uppercase">
                {lang === 'bn' ? 'নতুন যোগ' : 'Custom'}
              </span>
            </div>
          )}

          {/* List of matched professions */}
          {filteredProfessions.length > 0 ? (
            filteredProfessions.map((item, idx) => {
              const isSelected = value.trim().toLowerCase() === item.name.trim().toLowerCase();
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={`${item.name}-${idx}`}
                  onClick={() => handleSelect(item.name)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`p-2.5 px-3.5 flex items-center justify-between cursor-pointer transition ${
                    isHighlighted ? 'bg-emerald-50/80 text-[#0A6A32]' : isSelected ? 'bg-emerald-50/50 font-bold' : 'hover:bg-slate-50 text-gray-800'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-xs truncate text-gray-900">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0A6A32] shrink-0 inline-block"></span>
                      <span>{item.category}</span>
                    </p>
                  </div>

                  {isSelected ? (
                    <Check className="w-4 h-4 text-[#0A6A32] shrink-0" />
                  ) : (
                    <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                      {lang === 'bn' ? 'নির্বাচন' : 'Select'}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p className="text-xs">{lang === 'bn' ? 'কোনো তালিকাভুক্ত পেশা পাওয়া যায়নি।' : 'No listed profession found.'}</p>
              <button
                type="button"
                onClick={handleCustomAdd}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A6A32] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-800 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? `"${query}" কাস্টম হিসেবে রাখুন` : `Use "${query}" as Custom`}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
