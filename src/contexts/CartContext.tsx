/**
 * Cart context for pharmacy flow. In-memory (persists for session).
 * Cart item shape matches Frontend: _id, sellerId, name, price, originalPrice, image, quantity, sku, stock.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface CartItem {
  lineId: string;
  _id: string;
  sellerId: string | null;
  name: string;
  price: number;
  originalPrice?: number;
  image: string | null;
  quantity: number;
  sku?: string;
  stock?: number;
  variantId?: string | null;
  variantName?: string | null;
}

export interface CartVariantOption {
  _id?: string;
  id?: string;
  name?: string;
  sku?: string | null;
  price?: number;
  discountPrice?: number | null;
  stock?: number;
}

type CartContextValue = {
  cartItems: CartItem[];
  addToCart: (product: Record<string, unknown>, quantity?: number, options?: { variant?: CartVariantOption | null }) => void;
  removeFromCart: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  isInCart: (productId: string, variantId?: string | null) => boolean;
  getCartSellerId: () => string | null;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Record<string, unknown>, quantity = 1, options: { variant?: CartVariantOption | null } = {}) => {
    const id = (product?._id ?? product?.id) as string | undefined;
    if (!id) return;
    const variant = options.variant ?? null;
    const variantId = variant?._id ?? variant?.id ?? null;
    const lineId = `${id}:${variantId ?? 'default'}`;

    const seller = product?.sellerId;
    const sellerId =
      seller && typeof seller === 'object'
        ? (seller as { _id?: string })?._id ?? null
        : (seller as string) ?? null;

    setCartItems((prev) => {
      const existing = prev.find((x) => x.lineId === lineId);
      const unitPrice =
        typeof variant?.discountPrice === 'number' && variant.discountPrice > 0
          ? variant.discountPrice
          : typeof variant?.price === 'number'
            ? variant.price
            : typeof product?.discountPrice === 'number' && (product.discountPrice as number) > 0
              ? (product.discountPrice as number)
              : (product?.price as number) ?? 0;
      const images = product?.images as string[] | undefined;
      const image = Array.isArray(images) && images.length > 0 ? images[0] : null;

      if (existing) {
        return prev.map((x) =>
          x.lineId === lineId
            ? { ...x, quantity: (x.quantity || 0) + quantity }
            : x
        );
      }
      return [
        ...prev,
        {
          lineId,
          _id: id,
          sellerId,
          name: (product?.name as string) || 'Product',
          price: typeof unitPrice === 'number' ? unitPrice : Number(unitPrice || 0),
          originalPrice: product?.price as number | undefined,
          image,
          quantity,
          sku: variant?.sku ?? product?.sku as string | undefined,
          stock: variant?.stock ?? product?.stock as number | undefined,
          variantId: variantId ? String(variantId) : null,
          variantName: variant?.name ?? null,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((lineId: string) => {
    setCartItems((prev) => prev.filter((x) => x.lineId !== lineId));
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((x) => x.lineId !== lineId));
      return;
    }
    setCartItems((prev) =>
      prev.map((x) => (x.lineId === lineId ? { ...x, quantity } : x))
    );
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const getCartTotal = useCallback(
    () => cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [cartItems]
  );

  const getCartItemCount = useCallback(
    () => cartItems.reduce((count, item) => count + Number(item.quantity || 0), 0),
    [cartItems]
  );

  const isInCart = useCallback(
    (productId: string, variantId?: string | null) => cartItems.some((x) =>
      String(x._id) === String(productId) && String(x.variantId ?? '') === String(variantId ?? '')
    ),
    [cartItems]
  );

  const getCartSellerId = useCallback(
    () => cartItems[0]?.sellerId ?? null,
    [cartItems]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount,
      isInCart,
      getCartSellerId,
    }),
    [
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount,
      isInCart,
      getCartSellerId,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
