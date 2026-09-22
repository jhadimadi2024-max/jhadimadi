import React from 'react';
import { CartItem, Language } from '../types';
import { CartDrawerModal, CartItemType } from './CartDrawerModal';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  lang: Language;
}

/**
 * CartModal (Consolidated Wrapper):
 * Directly wraps and delegates to the unified CartDrawerModal to guarantee
 * 100% consistent OTP verification, Cash on Delivery (COD), Direct Contact,
 * and future-proofed database submission logic across all entry points.
 */
export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  lang,
}) => {
  const mappedItems: CartItemType[] = cart.map(item => ({
    product: item.product as any,
    quantity: item.quantity
  }));

  return (
    <CartDrawerModal
      isOpen={isOpen}
      onClose={onClose}
      cartItems={mappedItems}
      onUpdateQty={onUpdateQuantity}
      onRemoveItem={onRemoveItem}
      onClearCart={onClearCart}
      lang={lang}
    />
  );
};
