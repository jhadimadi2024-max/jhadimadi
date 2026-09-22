/**
 * In-App Escrow & 5% Platform Commission Service for Jhadimadi.com
 * Rules:
 * 1. All service bookings and product orders are routed via the central escrow gateway.
 * 2. 5% platform service charge is deducted automatically for Jhadimadi.com.
 * 3. 95% net payout is released to the service provider's or vendor's in-app wallet upon confirmation.
 * 4. Direct phone & address are masked until booking/order is locked in escrow.
 */

export interface EscrowTransaction {
  id: string;
  type: 'service_booking' | 'product_order';
  clientName: string;
  clientPhone: string;
  providerOrVendorId: string;
  providerOrVendorName: string;
  providerUniqueId: string;
  itemOrServiceTitle: string;
  totalAmount: number;
  platformFee5Pct: number;
  netPayout95Pct: number;
  status: 'held_in_escrow' | 'completed' | 'refunded' | 'cashout_requested';
  paymentMethod: 'bKash' | 'Nagad' | 'Bank' | 'CashOnDelivery';
  createdAt: string;
  completedAt?: string;
  trxId: string;
  location: string;
}

export interface ProviderWallet {
  providerId: string;
  totalEarnings: number;
  heldInEscrow: number;
  availableBalance: number;
  withdrawnAmount: number;
  transactions: EscrowTransaction[];
}

const ESCROW_STORAGE_KEY = 'jhadimadi_escrow_ledger';

export const getEscrowLedger = (): EscrowTransaction[] => {
  try {
    const raw = localStorage.getItem(ESCROW_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const createEscrowBooking = (
  type: 'service_booking' | 'product_order',
  clientName: string,
  clientPhone: string,
  providerOrVendorId: string,
  providerOrVendorName: string,
  providerUniqueId: string,
  itemOrServiceTitle: string,
  totalAmount: number,
  paymentMethod: 'bKash' | 'Nagad' | 'Bank' | 'CashOnDelivery',
  location: string
): EscrowTransaction => {
  const platformFee5Pct = Math.round(totalAmount * 0.05);
  const netPayout95Pct = totalAmount - platformFee5Pct;
  const trxId = 'JM-' + Math.random().toString(36).substring(2, 9).toUpperCase();

  const newTx: EscrowTransaction = {
    id: 'esc_' + Date.now(),
    type,
    clientName,
    clientPhone,
    providerOrVendorId,
    providerOrVendorName,
    providerUniqueId,
    itemOrServiceTitle,
    totalAmount,
    platformFee5Pct,
    netPayout95Pct,
    status: 'held_in_escrow',
    paymentMethod,
    createdAt: new Date().toISOString().split('T')[0],
    trxId,
    location
  };

  const ledger = getEscrowLedger();
  ledger.unshift(newTx);
  try {
    localStorage.setItem(ESCROW_STORAGE_KEY, JSON.stringify(ledger));
  } catch (e) {
    console.error('Failed to save escrow ledger', e);
  }

  return newTx;
};

export const getProviderWalletSummary = (providerOrVendorId: string, providerUniqueId?: string): ProviderWallet => {
  const ledger = getEscrowLedger();
  const providerTxs = ledger.filter(t => 
    t.providerOrVendorId === providerOrVendorId || 
    (providerUniqueId && t.providerUniqueId === providerUniqueId)
  );

  let totalEarnings = 0;
  let heldInEscrow = 0;
  let availableBalance = 0;

  providerTxs.forEach(tx => {
    if (tx.status === 'completed') {
      totalEarnings += tx.netPayout95Pct;
      availableBalance += tx.netPayout95Pct;
    } else if (tx.status === 'held_in_escrow') {
      heldInEscrow += tx.netPayout95Pct;
    }
  });

  return {
    providerId: providerOrVendorId,
    totalEarnings,
    heldInEscrow,
    availableBalance,
    withdrawnAmount: 0,
    transactions: providerTxs
  };
};
