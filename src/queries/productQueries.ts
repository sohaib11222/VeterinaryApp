/**
 * Product queries – list and get by id.
 * Backend list returns { success, data: { products, pagination } }.
 * Backend get returns { success, data: product } (with sellerId/petStoreId populated).
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface ProductListParams {
  search?: string;
  category?: string;
  sellerId?: string;
  sellerType?: string;
  page?: number;
  limit?: number;
  isActive?: boolean | string;
}

export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () =>
      api.get<{ success: boolean; data?: { products?: unknown[]; pagination?: unknown } }>(
        API_ROUTES.PRODUCTS.LIST,
        { params }
      ),
  });
}

export function useProduct(productId: string | null | undefined) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: () =>
      api.get<{ success: boolean; data?: unknown }>(
        API_ROUTES.PRODUCTS.GET(productId!)
      ),
    enabled: !!productId,
  });
}

/** Products for current pharmacy/parapharmacy. */
export function useMyProducts(params: { page?: number; limit?: number; isActive?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ['products', 'mine', params],
    queryFn: () =>
      api.get<{ success: boolean; data?: { products?: unknown[]; items?: unknown[]; pagination?: { total?: number }; total?: number } }>(
        API_ROUTES.PRODUCTS.MINE,
        { params }
      ),
  });
}
