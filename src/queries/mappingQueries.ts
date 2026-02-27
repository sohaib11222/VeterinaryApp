import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface NearbyClinic {
  clinicId: string;
  veterinarianId: string;
  veterinarianName?: string;
  clinicName?: string;
  address?: string;
  city?: string;
  phone?: string;
  distance?: number;
  coordinates?: { lat: number; lng: number };
}

export interface ClinicLocation {
  clinicId: string;
  veterinarianId: string;
  veterinarianName?: string;
  clinicName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  coordinates?: { lat: number; lng: number };
  timings?: Array<{ dayOfWeek?: string; startTime?: string; endTime?: string }>;
  images?: string[];
}

export interface RouteInfo {
  distance?: number;
  distanceUnit?: string;
  estimatedTime?: number;
  estimatedTimeUnit?: string;
  routeSteps?: Array<{ instruction?: string; distance?: number }>;
  from?: { lat: number; lng: number };
  to?: { lat: number; lng: number };
}

export function useNearbyClinics(
  lat: number | null | undefined,
  lng: number | null | undefined,
  radius = 10,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['mapping', 'nearby', lat, lng, radius],
    queryFn: () =>
      api.get<{ success?: boolean; data?: unknown }>(API_ROUTES.MAPPING.NEARBY, {
        params: { lat, lng, radius },
      }),
    enabled: !!(lat && lng) && options.enabled !== false,
  });
}

export function useClinicsWithCoordinates(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['mapping', 'clinics'],
    queryFn: () => api.get<{ success?: boolean; data?: unknown }>(API_ROUTES.MAPPING.CLINICS),
    enabled: options.enabled !== false,
  });
}

export function useClinicLocation(clinicId: string | null | undefined, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['mapping', 'clinic', clinicId],
    queryFn: () => api.get<{ success?: boolean; data?: unknown }>(API_ROUTES.MAPPING.CLINIC(clinicId!)),
    enabled: !!clinicId && options.enabled !== false,
  });
}

export function useRouteInfo(
  params: {
    fromLat: number | null | undefined;
    fromLng: number | null | undefined;
    toLat: number | null | undefined;
    toLng: number | null | undefined;
  },
  options: { enabled?: boolean } = {}
) {
  const enabled =
    !!params.fromLat &&
    !!params.fromLng &&
    !!params.toLat &&
    !!params.toLng &&
    options.enabled !== false;

  return useQuery({
    queryKey: ['mapping', 'route', params],
    queryFn: () =>
      api.get<{ success?: boolean; data?: unknown }>(API_ROUTES.MAPPING.ROUTE, {
        params: {
          fromLat: params.fromLat,
          fromLng: params.fromLng,
          toLat: params.toLat,
          toLng: params.toLng,
        },
      }),
    enabled,
  });
}
