import React, { useState, useEffect } from 'react';
import { 
  Package, Truck, Clock, CheckCircle2, MapPin, Phone, 
  Search, RefreshCw, AlertCircle, ArrowRight, Wrench, ShoppingBag
} from 'lucide-react';
import { Language } from '../types';

interface OrdersTrackerScreenProps {
  onBack: () => void;
  lang?: Language;
  onOpenBookingModal?: () => void;
}

export const OrdersTrackerScreen: React.FC<OrdersTrackerScreenProps> = ({
  onBack,
  lang = 'bn',
  onOpenBookingModal,
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load local stored orders or fallback mock orders
    try {
      const stored = localStorage.getItem('jhadimadi_my_orders');
      if (stored) {
        setOrders(JSON.parse(stored));
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.warn(e);
      setOrders([]);
    }
  }, []);

  const filteredOrders = orders.filter((o) => 
    o.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#689F38]" />
            <span>অর্ডার ও ট্র্যাকিং হিস্ট্রি (Orders & Logistics)</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            আপনার অন-ডিমান্ড সার্ভিস, অর্গানিক শপিং ও পার্সেল ট্র্যাকিং
          </p>
        </div>

        {onOpenBookingModal && (
          <button
            onClick={onOpenBookingModal}
            className="px-3 py-1.5 bg-[#8BC34A] hover:bg-[#7CB342] text-slate-950 rounded-xl text-xs font-black shadow-xs cursor-pointer transition active:scale-95 flex items-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>নতুন অর্ডার</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="অর্ডার আইডি (যেমন: JM-782104) বা নাম দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:outline-hidden focus:border-[#8BC34A] focus:ring-1 focus:ring-[#8BC34A] shadow-2xs"
        />
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">কোনো অর্ডার পাওয়া যায়নি</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            আপনি এখনও কোনো সার্ভিস বা পার্সেল বুকিং করেননি। হোম পেজ থেকে সহজেই অর্ডার করতে পারেন।
          </p>
          {onOpenBookingModal && (
            <button
              onClick={onOpenBookingModal}
              className="px-4 py-2 bg-[#8BC34A] hover:bg-[#7CB342] text-slate-950 rounded-xl text-xs font-black cursor-pointer shadow-xs"
            >
              সার্ভিস বা পার্সেল বুক করুন
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((ord) => {
            const isDelivered = ord.status === 'delivered';
            const isInProgress = ord.status === 'in_progress';
            
            return (
              <div 
                key={ord.orderId}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs hover:border-[#8BC34A]/80 transition-all space-y-3"
              >
                {/* Order Top Bar */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${
                      ord.category === 'service' ? 'bg-lime-50 text-[#689F38]' :
                      ord.category === 'ecommerce' ? 'bg-amber-50 text-amber-600' : 'bg-cyan-50 text-cyan-600'
                    }`}>
                      {ord.category === 'service' ? <Wrench className="w-4 h-4" /> :
                       ord.category === 'ecommerce' ? <ShoppingBag className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-slate-900">{ord.orderId}</span>
                        {ord.urgent && (
                          <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 font-bold text-[9px] rounded-md">
                            জরুরি
                          </span>
                        )}
                      </div>
                      <span className="text-[10.5px] text-slate-500 font-medium">
                        {new Date(ord.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 ${
                    isDelivered ? 'bg-lime-100 text-[#689F38]' :
                    isInProgress ? 'bg-blue-100 text-blue-800 animate-pulse' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isDelivered ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span>{isDelivered ? 'সম্পন্ন' : isInProgress ? 'চলমান (In Progress)' : 'অর্ডার গৃহীত'}</span>
                  </span>
                </div>

                {/* Details info */}
                <div className="space-y-1 text-xs text-slate-700">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <span>{ord.details || 'সাধারণ সার্ভিস অর্ডার'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{ord.address}, {ord.district}</span>
                  </div>
                </div>

                {/* Rider / Provider Contact Strip */}
                {ord.assignedRider && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">দায়িত্বপ্রাপ্ত প্রতিনিধি / রাইডার:</span>
                      <span className="font-bold text-slate-800">{ord.assignedRider}</span>
                    </div>
                    {ord.riderPhone && (
                      <a
                        href={`tel:${ord.riderPhone}`}
                        className="px-2.5 py-1 bg-[#8BC34A] hover:bg-[#7CB342] text-slate-950 rounded-lg text-[10.5px] font-black flex items-center gap-1 cursor-pointer transition shadow-2xs"
                      >
                        <Phone className="w-3 h-3" />
                        <span>কল দিন</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Tracking Progress Bar */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span>অর্ডার গ্রহণ</span>
                    <span>রাইডার অ্যাসাইন</span>
                    <span>অন-দ্য-ওয়ে</span>
                    <span>ডেলিভার্ড</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="w-1/4 bg-[#8BC34A]"></div>
                    <div className={`w-1/4 ${ord.status !== 'confirmed' ? 'bg-[#8BC34A]' : 'bg-slate-200'}`}></div>
                    <div className={`w-1/4 ${isInProgress || isDelivered ? 'bg-[#8BC34A]' : 'bg-slate-200'}`}></div>
                    <div className={`w-1/4 ${isDelivered ? 'bg-[#8BC34A]' : 'bg-slate-200'}`}></div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
