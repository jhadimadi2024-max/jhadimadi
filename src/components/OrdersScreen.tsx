import React, { useState } from 'react';
import { 
  Package, Clock, CheckCircle2, Phone, MapPin, 
  ArrowLeft, Truck, Car, ShoppingBag, Wrench, HeartPulse, 
  AlertCircle, RefreshCw 
} from 'lucide-react';
import { Booking, Language, CartItem } from '../types';

interface OrdersScreenProps {
  onBack: () => void;
  lang: Language;
  bookings: Booking[];
  cart?: CartItem[];
  onTrackBooking?: (booking: Booking) => void;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  onBack,
  lang,
  bookings,
  cart = [],
  onTrackBooking,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const allOrdersList = bookings;

  const filteredOrders = allOrdersList.filter((item) => {
    if (filter === 'active') return item.status === 'EnRoute' || item.status === 'Accepted' || item.status === 'Pending' || item.status === 'InProgress';
    if (filter === 'completed') return item.status === 'Completed' || item.status === 'Cancelled';
    return true;
  });

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'EnRoute':
        return (
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-extrabold text-[9px] flex items-center gap-1 animate-pulse">
            <Truck className="w-3 h-3" />
            <span>রাইডার পথে আছে (EnRoute)</span>
          </span>
        );
      case 'Accepted':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[9px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>গৃহীত হয়েছে (Accepted)</span>
          </span>
        );
      case 'InProgress':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-[9px] flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>কাজ চলছে (In Progress)</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-extrabold text-[9px]">
            ✓ সম্পন্ন হয়েছে (Completed)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-extrabold text-[9px]">
            ⏳ পেন্ডিং কনফার্মেশন
          </span>
        );
    }
  };

  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'organic_ecommerce':
        return <ShoppingBag className="w-4 h-4 text-[#00A86B]" />;
      case 'home_healthcare':
        return <HeartPulse className="w-4 h-4 text-rose-500" />;
      case 'freelance_technician':
        return <Wrench className="w-4 h-4 text-blue-500" />;
      default:
        return <Car className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 space-y-3.5 shadow-sm pb-24">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <button
          onClick={onBack}
          className="p-1 text-slate-700 hover:text-black flex items-center gap-1 font-bold text-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#00A86B]" />
          <span>{lang === 'bn' ? 'হোমে ফিরুন' : 'Back'}</span>
        </button>
        <div className="flex items-center gap-1.5">
          <Package className="w-4 h-4 text-[#00A86B]" />
          <h3 className="font-extrabold text-xs text-slate-800">
            {lang === 'bn' ? 'আমার অর্ডার ও বুকিং ট্র্যাকিং' : 'My Orders & Bookings'}
          </h3>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 rounded-xl font-bold transition text-[11px] cursor-pointer ${
            filter === 'all'
              ? 'bg-[#00A86B] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          সব ({allOrdersList.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`flex-1 py-1.5 rounded-xl font-bold transition text-[11px] cursor-pointer ${
            filter === 'active'
              ? 'bg-[#00A86B] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          চলমান / অ্যাক্টিভ ({allOrdersList.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 py-1.5 rounded-xl font-bold transition text-[11px] cursor-pointer ${
            filter === 'completed'
              ? 'bg-[#00A86B] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          সম্পন্ন ({allOrdersList.filter(o => o.status === 'Completed').length})
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
          <Package className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="font-bold text-xs text-slate-700">কোনো অর্ডার পাওয়া যায়নি</h4>
          <p className="text-[11px] text-slate-500">
            আপনি এখনও কোনো সার্ভিস বা পণ্য বুক করেননি।
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-3 space-y-2 hover:border-[#00A86B] transition shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                    {getModuleIcon(order.moduleId)}
                  </div>
                  <div>
                    <span className="font-black text-[11px] text-slate-800 block">
                      অর্ডার #{order.id}
                    </span>
                    <span className="text-[9.5px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{order.createdAt}</span>
                    </span>
                  </div>
                </div>

                {getStatusBadge(order.status)}
              </div>

              <div>
                <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                  {order.serviceTitleBn}
                </h4>
                <p className="text-[10px] text-slate-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />
                  <span className="truncate">{order.location}</span>
                </p>
              </div>

              {order.status === 'EnRoute' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-xs space-y-1">
                  <div className="flex items-center justify-between text-blue-900 font-extrabold text-[10.5px]">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-blue-600 animate-bounce" />
                      <span>লাইভ লোকেশন ট্র্যাকিং</span>
                    </span>
                    <span>আনুমানিক ৮ মিনিট</span>
                  </div>
                  <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full w-3/4 rounded-full animate-pulse"></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-[9.5px] text-slate-400 block">মোট বিল (Escrow)</span>
                  <span className="font-black text-xs text-[#00A86B]">৳ {order.totalAmount}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="px-2.5 py-1.5 bg-[#00A86B] hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Phone className="w-3 h-3" />
                    <span>রাইডারকে কল</span>
                  </a>
                  {onTrackBooking && (
                    <button
                      onClick={() => onTrackBooking(order)}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-[10px] font-bold cursor-pointer"
                    >
                      বিস্তারিত
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
