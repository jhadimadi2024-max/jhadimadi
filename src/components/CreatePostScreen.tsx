import React, { useState } from 'react';
import { 
  Wrench, 
  ShoppingBag, 
  MapPin, 
  Sparkles, 
  Phone, 
  CheckCircle2, 
  PlusCircle,
  Building2,
  Upload,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { Language } from '../types';

type PostType = 'service' | 'product';
type UserRole = 'customer' | 'partner';

interface CreatePostScreenProps {
  lang?: Language;
  onPostSuccess?: (post: any) => void;
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  lang = 'bn',
  onPostSuccess,
}) => {
  const [userRole, setUserRole] = useState<UserRole>('customer');
  const [postType, setPostType] = useState<PostType>('service');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'পেশাদার সেবা',
    division: 'Chittagong Division (চট্টগ্রাম)',
    district: 'Khagrachhari',
    upazila: 'Khagrachhari Sadar',
    address: 'পানখাইয়াপাড়া',
    price: '',
    phone: '',
    whatsapp: '',
    description: '',
    isOrganicCHT: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.phone) {
      alert('অনুগ্রহ করে শিরোনাম ও যোগাযোগ নম্বর পূরণ করুন।');
      return;
    }

    const newPost = {
      id: `post_${Date.now()}`,
      userRole,
      postType,
      ...formData,
      createdAt: new Date().toISOString()
    };

    // Save to local persistence
    try {
      const existing = JSON.parse(localStorage.getItem('jhadimadi_local_posts') || '[]');
      existing.unshift(newPost);
      localStorage.setItem('jhadimadi_local_posts', JSON.stringify(existing));
    } catch (e) {
      console.warn('Storage error:', e);
    }

    setIsSuccess(true);
    if (onPostSuccess) {
      onPostSuccess(newPost);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 text-center border border-stone-200 shadow-md space-y-4 my-6 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#1E4D2B] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-black text-stone-900">আপনার পোস্টটি সফলভাবে লাইভ হয়েছে!</h3>
        <p className="text-xs sm:text-sm text-stone-600">
          পার্বত্য চট্টগ্রামের গ্রাহক ও পেশাজীবীরা আপনার সাথে সরাসরি ফোন ও হোয়াটসঅ্যাপে যোগাযোগ করতে পারবেন।
        </p>
        <button
          onClick={() => {
            setIsSuccess(false);
            setFormData({
              title: '',
              category: 'ইলেকট্রিশিয়ান ও টেকনিশিয়ান',
              division: 'Chittagong Division (চট্টগ্রাম)',
              district: 'Khagrachhari',
              upazila: 'Khagrachhari Sadar',
              address: 'পানখাইয়াপাড়া',
              price: '',
              phone: '',
              whatsapp: '',
              description: '',
              isOrganicCHT: true
            });
          }}
          className="px-6 py-2.5 bg-[#1E4D2B] hover:bg-[#15371e] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          আরেকটি পোস্ট করুন
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-lg border border-stone-200 overflow-hidden my-4 sm:my-6 animate-in fade-in duration-300">
      
      {/* ১. শীর্ষ হেডার ও টগল */}
      <div className="bg-gradient-to-r from-[#1E4D2B] via-[#2A653B] to-[#1E4D2B] p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Jhadimadi.com পোস্ট ফর্ম</h2>
            <p className="text-xs text-emerald-100 font-medium">পাহাড়ি পণ্য বিক্রয় ও লোকাল কাজের রিকোয়েস্ট সাবমিট করুন</p>
          </div>
          <span className="bg-[#D97706]/30 text-amber-200 border border-amber-400/40 text-[11px] px-3 py-1 rounded-full font-bold">
            পার্বত্য ৩ জেলা
          </span>
        </div>

        {/* গ্রাহক / পার্টনার টগল */}
        <div className="flex bg-[#14391e] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setUserRole('customer')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              userRole === 'customer' 
                ? 'bg-white text-[#1E4D2B] shadow-xs' 
                : 'text-stone-300 hover:text-white'
            }`}
          >
            👨‍💼 সাধারণ গ্রাহক / ক্রেতা
          </button>
          <button
            type="button"
            onClick={() => setUserRole('partner')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              userRole === 'partner' 
                ? 'bg-white text-[#1E4D2B] shadow-xs' 
                : 'text-stone-300 hover:text-white'
            }`}
          >
            🤝 সেবাদাতা / বিক্রেতা পার্টনার
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-4 sm:space-y-5">

        {/* ২. পোস্ট টাইপ */}
        <div>
          <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
            পোস্টের ধরন নির্বাচন করুন *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPostType('service')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-xs sm:text-sm font-black transition-all cursor-pointer ${
                postType === 'service'
                  ? 'bg-[#1E4D2B] text-white border-[#1E4D2B] shadow-sm'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Wrench className="w-4 h-4 text-[#D97706]" />
              <span>সার্ভিস / কাজের রিকোয়েস্ট</span>
            </button>
            <button
              type="button"
              onClick={() => setPostType('product')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-xs sm:text-sm font-black transition-all cursor-pointer ${
                postType === 'product'
                  ? 'bg-[#1E4D2B] text-white border-[#1E4D2B] shadow-sm'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#D97706]" />
              <span>পাহাড়ি পণ্য বিক্রয়</span>
            </button>
          </div>
        </div>

        {/* ৩. শিরোনাম */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            পোস্টের শিরোনাম (Title) *
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder={postType === 'service' ? "উদা: পানখাইয়াপাড়ায় গাছ কাটার জন্য ২ জন অভিজ্ঞ শ্রমিক লাগবে" : "উদা: খাঁটি পাহাড়ি চাকের মধু ও বোম্বাই শুটকি"}
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#1E4D2B] focus:bg-white transition-all"
          />
        </div>

        {/* ৪. ক্যাটাগরি ও মূল্য */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">ক্যাটাগরি *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-[#1E4D2B]"
            >
              <option value="রিয়েল এস্টেট">রিয়েল এস্টেট</option>
              <option value="পোশাক-আশাক / ড্রেস">পোশাক-আশাক / ড্রেস</option>
              <option value="ফুড ও খাবার">ফুড ও খাবার</option>
              <option value="গাড়ি ও যানবাহন">গাড়ি ও যানবাহন</option>
              <option value="পেশাদার সেবা">পেশাদার সেবা</option>
              <option value="ইলেকট্রনিক্স">ইলেকট্রনিক্স</option>
              <option value="গহনা ও অলংকার">গহনা ও অলংকার</option>
              <option value="বাসা ভাড়া">বাসা ভাড়া</option>
              <option value="টিউশনি ও শিক্ষা">টিউশনি ও শিক্ষা</option>
              <option value="কৃষি ও পাহাড়ি শিল্প">কৃষি ও পাহাড়ি শিল্প</option>
              <option value="হস্তশিল্প">হস্তশিল্প</option>
              <option value="ট্যুর ও ট্রাভেলিং">ট্যুর ও ট্রাভেলিং</option>
              <option value="হোটেল ও রেস্টুরেন্ট">হোটেল ও রেস্টুরেন্ট</option>
              <option value="পশুপাখি চিকিৎসা">পশুপাখি চিকিৎসা</option>
              <option value="স্বাস্থ্য ও রূপচর্চা">স্বাস্থ্য ও রূপচর্চা</option>
              <option value="চাকরি">চাকরি (নিয়োগ / কাজের সুযোগ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              প্রত্যাশিত বাজেট / মূল্য (৳ টাকায়)
            </label>
            <input
              type="number"
              name="price"
              placeholder="উদা: 800"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-bold text-[#8B4513]"
            />
          </div>
        </div>

        {/* ৫. ভৌগোলিক অবস্থান (জেলা ও উপজেলা) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">জেলা (District) *</label>
            <select
              name="district"
              value={formData.district}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
            >
              <option value="Khagrachhari">Khagrachhari (খাগড়াছড়ি)</option>
              <option value="Rangamati">Rangamati (রাঙামাটি)</option>
              <option value="Bandarban">Bandarban (বান্দরবান)</option>
              <option value="Chittagong">Chittagong (চট্টগ্রাম)</option>
              <option value="Dhaka">Dhaka (ঢাকা)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">উপজেলা / থানা *</label>
            <select
              name="upazila"
              value={formData.upazila}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
            >
              <option value="Khagrachhari Sadar">Khagrachhari Sadar</option>
              <option value="Dighinala">Dighinala</option>
              <option value="Panchhari">Panchhari</option>
              <option value="Mahalchhari">Mahalchhari</option>
              <option value="Matiranga">Matiranga</option>
              <option value="Guimara">Guimara</option>
              <option value="Ramgarh">Ramgarh</option>
              <option value="Rangamati Sadar">Rangamati Sadar</option>
              <option value="Kaptai">Kaptai</option>
              <option value="Bandarban Sadar">Bandarban Sadar</option>
            </select>
          </div>
        </div>

        {/* ৬. পাড়া ও পূর্ণ ঠিকানা */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            পাড়া / মহল্লা ও পূর্ণ ঠিকানা (Address) *
          </label>
          <input
            type="text"
            name="address"
            placeholder="উদা: পানখাইয়াপাড়া, শালবন, খাগড়াপুর"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium"
          />
        </div>

        {/* ৭. মোবাইল নম্বর ও WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">মোবাইল ফোন নম্বর *</label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="018XXXXXXXX"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">হোয়াটসঅ্যাপ (WhatsApp)</label>
            <input
              type="tel"
              name="whatsapp"
              placeholder="018XXXXXXXX (যদি থাকে)"
              value={formData.whatsapp}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium"
            />
          </div>
        </div>

        {/* ৮. বিস্তারিত বিবরণ */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            কাজের / পণ্যের বিস্তারিত বিবরণ (Description)
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="কাজের সময়, বিস্তারিত স্পেসিফিকেশন বা শর্তাবলী সংক্ষেপে লিখুন..."
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#1E4D2B]"
          />
        </div>

        {/* ৯. CHT Organic / Local Authenticity Checkbox */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-stone-800">
            <input
              type="checkbox"
              name="isOrganicCHT"
              checked={formData.isOrganicCHT}
              onChange={handleChange}
              className="w-4 h-4 rounded text-[#1E4D2B] focus:ring-[#1E4D2B]"
            />
            <span>এটি শতভাগ পার্বত্য অঞ্চলে উৎপাদিত পণ্য / স্থানীয় সেবা</span>
          </label>
          <Sparkles className="w-4 h-4 text-[#1E4D2B]" />
        </div>

        {/* সাবমিট বোতাম */}
        <button
          type="submit"
          className="w-full py-3.5 bg-[#1E4D2B] hover:bg-[#15371e] text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <PlusCircle className="w-5 h-5 text-[#D97706]" />
          <span>পোস্টটি বিনামূল্যে প্রকাশ করুন</span>
        </button>

      </form>

    </div>
  );
};
