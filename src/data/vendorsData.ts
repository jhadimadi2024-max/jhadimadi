import { District } from '../types';

export interface VendorStoreProduct {
  id: string;
  nameBn: string;
  nameEn: string;
  category: string;
  categoryLabelBn: string;
  price: number;
  originalPrice: number;
  unit: string;
  stock: number;
  origin: string; // Micro-location (e.g. খাগড়াছড়ি সদর > মধুপুর বাজার)
  district: string;
  upazila: string;
  mahalla: string;
  bazarName?: string;
  image: string;
  images: string[]; // 5 to 10 high-quality gallery images
  rating: number;
  reviewsCount: number;
  badge?: string;
  badgeColor?: string;
  descriptionBn: string;
  descriptionEn: string;
  features: string[];
  specifications: { labelBn: string; valueBn: string }[]; // Quality specs
  variants?: {
    sizes?: { nameBn: string; priceOffset: number }[];
    colors?: { nameBn: string; hex: string }[];
  };
  warranty?: string;
  qrCode?: string;
  barcode?: string;
  isOrganic?: boolean;
  featuredOnHome?: boolean;
  sellerId: string;
  sellerUniqueId: string; // e.g. V-KHG-001
  sellerShopName: string;
  sellerOwnerName: string;
  sellerAvatar?: string;
  sellerRating?: number;
  sellerPhoneMasked?: string;
  sellerRealPhone?: string;
  verifiedSeller?: boolean;
}

export interface VendorEscrowSettlement {
  id: string;
  orderId: string;
  productName: string;
  customerName: string;
  customerPhoneMasked: string;
  grossAmount: number;
  platformFee5Percent: number; // 5% Jhadimadi platform commission
  netPayout95Percent: number; // 95% Vendor net earnings
  date: string;
  status: 'Held_In_Escrow' | 'Delivered_Settled' | 'Disputed' | 'Refunded';
}

export interface VendorCashoutTransaction {
  id: string;
  amount: number;
  method: 'bKash' | 'Nagad' | 'Bank';
  accountNumber: string;
  bankName?: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Rejected';
  trxId: string;
}

export interface VendorStore {
  id: string;
  uniqueId: string; // V-[District Code]-[Serial], e.g. V-KHG-001, V-RNG-001
  shopName: string;
  shopNameEn: string;
  ownerName: string;
  avatar: string;
  banner: string;
  coverBanner?: string;
  phone?: string;
  phoneMasked: string; // 018****-***78
  realPhone: string;
  division: string;
  district: string;
  upazila: string;
  mahalla: string;
  bazarName: string;
  detailedAddress: string;
  rating: number;
  reviewsCount: number;
  positiveRatingPercent: number; // e.g. 98%
  shipOnTimePercent: number; // e.g. 99%
  responseRatePercent: number; // e.g. 95%
  followersCount: number;
  isVerified: boolean;
  verifiedBadgeText: string;
  categories: string[];
  aboutBn: string;
  bio?: string;
  tradeLicenseNumber: string;
  nidNumberMasked: string;
  establishedYear: string;
  wallet: {
    grossSales: number;
    totalCommissionPaid?: number; // 5%
    availableBalance: number; // 95% net
    pendingEscrowBalance?: number;
    pendingPayouts?: number;
    completedPayouts?: number;
    totalOrdersCount?: number;
    cashouts: (VendorCashoutTransaction | any)[];
    escrowSettlements?: VendorEscrowSettlement[];
  };
  products: VendorStoreProduct[];
}

export const INITIAL_VENDOR_STORES: VendorStore[] = [];
