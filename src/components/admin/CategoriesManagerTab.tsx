import React, { useState } from 'react';
import { 
  Layers, Plus, Edit3, Trash2, CheckCircle2, 
  Smartphone, Utensils, Shirt, Home, Sparkles, 
  ArrowRight, Search, Zap, Check, Eye
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface CategoriesManagerTabProps {
  onSelectCategory: (categoryKey: string) => void;
  onAddNewProductWithCategory: (categoryKey: string) => void;
}

export const CategoriesManagerTab: React.FC<CategoriesManagerTabProps> = ({
  onSelectCategory,
  onAddNewProductWithCategory
}) => {
  const { products } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  // Primary categories explicitly requested by user
  const primaryCategories = [
    {
      id: 'Electronics',
      key: 'Electronics',
      nameBn: 'ইলেকট্রনিক্স ও গ্যাজেট',
      nameEn: 'Electronics & Gadgets',
      icon: Smartphone,
      color: 'bg-blue-600',
      textColor: 'text-blue-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'মোবাইল, ক্যামেরা, ল্যাপটপ, সোলার লাইট ও ইলেকট্রনিক সরঞ্জামাদি।',
      suggestedItems: ['সোলার প্যানেল সিস্টেম', 'স্মার্টফোন ও এক্সেসরিজ', 'জরুরি ব্যাটারি লাইট']
    },
    {
      id: 'SpicesGrains',
      key: 'SpicesGrains',
      nameBn: 'পাহাড়ি অর্গানিক ফুড ও শস্য',
      nameEn: 'Hill Organic Food & Spices',
      icon: Utensils,
      color: 'bg-emerald-600',
      textColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: '১০০% খাঁটি পাহাড়ি আতপ চাল, জুমের হলুদ, নাগা মরিচ ও পাহাড়ি মসলা।',
      suggestedItems: ['খাঁটি পাহাড়ি চালের গুঁড়া', 'জুমের খাঁটি হলুদ গুঁড়া', 'নাগা মরিচের গুঁড়া']
    },
    {
      id: 'Clothing',
      key: 'Clothing',
      nameBn: 'পোশাক ও পাহাড়ি ফ্যাশন',
      nameEn: 'Clothing & Hill Fashion',
      icon: Shirt,
      color: 'bg-rose-600',
      textColor: 'text-rose-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      description: 'চাকমা থামি, মারমা পিনন হাদি, ত্রিপুরা রিনাই ও ঐতিহ্যবাহী পাহাড়ি পোশাক।',
      suggestedItems: ['চাকমা ঐতিহ্যবাহী থামি', 'মারমা সুতি পিনন হাদি', 'ত্রিপুরা রিনাই সেট']
    },
    {
      id: 'RealEstate',
      key: 'RealEstate',
      nameBn: 'রিয়েল এস্টেট, জমি ও ফ্ল্যাট',
      nameEn: 'Real Estate & Properties',
      icon: Home,
      color: 'bg-amber-600',
      textColor: 'text-amber-600',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'খাগড়াছড়ি, রাঙ্গামাটি ও বান্দরবানের কমার্শিয়াল জমি, বাগানবাড়ি ও ভাড়া ফ্ল্যাট।',
      suggestedItems: ['বাগানবাড়ি ও রিসোর্ট জমি', 'সদর আবাসিক প্লট', 'পাহাড়ি হোমস্টে ভিলা']
    },
    {
      id: 'CraftsHoney',
      key: 'CraftsHoney',
      nameBn: 'তাঁত, হস্তশিল্প ও পাহাড়ি মধু',
      nameEn: 'Handicrafts & Forest Honey',
      icon: Sparkles,
      color: 'bg-purple-600',
      textColor: 'text-purple-600',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'গভীর অরণ্যের পাহাড়ি চাকভাঙা কাঁচা মধু, বাঁশ ও বেতের শো-পিস।',
      suggestedItems: ['প্রাকৃতিক চাকভাঙা কাঁচা মধু', 'হস্তশিল্প বাঁশের বাস্কেট', 'কোমড় তাঁতের শাল']
    },
    {
      id: 'Services',
      key: 'Services',
      nameBn: 'কারিগরি ও পেশাদার সেবা',
      nameEn: 'Technical & Repair Services',
      icon: Zap,
      color: 'bg-slate-700',
      textColor: 'text-slate-700',
      badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
      description: 'অন-ডিমান্ড ইলেকট্রিশিয়ান, সোলার মেকানিক, রাজমিস্ত্রি ও কারিগরি সেবা।',
      suggestedItems: ['সোলার ও ওয়্যারিং টেকনিশিয়ান', 'প্লাম্বিং ও ফিটিংস', 'মোটরসাইকেল মেকানিক']
    }
  ];

  const filteredCategories = primaryCategories.filter(c => 
    c.nameBn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-900">
              মূল ক্যাটাগরি ও বিভাগ কন্ট্রোল
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {primaryCategories.length}টি সক্রিয় সেক্টর
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ইলেকট্রনিক্স, পাহাড়ি অর্গানিক ফুড, পোশাক ও রিয়েল এস্টেটসহ প্রতিটি ক্যাটাগরির পণ্য ও ডাটাবেস মনিটরিং।
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ক্যাটাগরি খুঁজুন..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* 2. Primary 4 Core Pillars Notice */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-950 text-white p-5 rounded-2xl shadow-md border border-emerald-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
            কোর ই-কমার্স পিলার
          </span>
          <h2 className="text-base font-extrabold mt-0.5">
            ইলেকট্রনিক্স • অর্গানিক ফুড • পোশাক • রিয়েল এস্টেট
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            ঝাদিমাদি ডটকমের প্রতিটি প্রধান ক্যাটাগরিতে পণ্য যুক্ত করা হলে তা তৎক্ষণাৎ বাম পাশের মোবাইল প্রিভিউতে এবং সুপাবেস ডাটাবেসে আপডেট হয়।
          </p>
        </div>
      </div>

      {/* 3. Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCategories.map((cat) => {
          const IconComp = cat.icon;
          // Calculate products count for this category
          const categoryProductsCount = products.filter(p => p.category === cat.key).length;

          return (
            <div 
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-3">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl ${cat.color} text-white flex items-center justify-center shadow-xs`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        {cat.nameBn}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {cat.nameEn}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.badgeBg}`}>
                    {categoryProductsCount}টি পণ্য
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 leading-relaxed">
                  {cat.description}
                </p>

                {/* Suggested Sample Products */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5">
                    জনপ্রিয় পণ্যসমূহ:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {cat.suggestedItems.map((item, idx) => (
                      <span 
                        key={idx} 
                        className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => onSelectCategory(cat.key)}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>পণ্যসমূহ দেখুন ({categoryProductsCount})</span>
                </button>
                <button
                  onClick={() => onAddNewProductWithCategory(cat.key)}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                  title="এই ক্যাটাগরিতে নতুন পণ্য যোগ করুন"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>যোগ করুন</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
