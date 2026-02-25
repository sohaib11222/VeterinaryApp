/**
 * Product mutations – create, update, delete (pharmacy/parapharmacy).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface CreateProductPayload {
  name: string;
  description?: string;
  sku?: string;
  price: number;
  discountPrice?: number;
  stock?: number;
  category?: string;
  tags?: string[] | string;
  requiresPrescription?: boolean;
  isActive?: boolean;
  images?: string[];
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductPayload) =>
      api.post<{ success: boolean; data?: unknown }>(API_ROUTES.PRODUCTS.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'mine'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: UpdateProductPayload }) =>
      api.put<{ success: boolean; data?: unknown }>(API_ROUTES.PRODUCTS.UPDATE(productId), data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'mine'] });
      if (variables?.productId) {
        queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      }
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      api.delete<{ success: boolean }>(API_ROUTES.PRODUCTS.DELETE(productId)),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });
}
