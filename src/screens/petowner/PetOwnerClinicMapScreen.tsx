import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useNearbyClinics } from '../../queries/mappingQueries';
import { useTranslation } from 'react-i18next';

type ClinicMarker = {
  id: string;
  clinicId: string;
  veterinarianId?: string;
  veterinarianName?: string;
  clinicName?: string;
  address?: string;
  city?: string;
  phone?: string;
  distance?: number;
  coordinates?: { lat: number; lng: number };
};

function normalizeNearbyClinics(response: unknown): ClinicMarker[] {
  const outer = (response as { data?: unknown })?.data ?? response;
  const payload = (outer as { data?: unknown })?.data ?? outer;
  const list = Array.isArray(payload) ? payload : [];
  return list
    .map((c: Record<string, unknown>) => {
      const coords = (c.coordinates as { lat?: unknown; lng?: unknown } | undefined) ?? undefined;
      const lat = coords?.lat != null ? Number(coords.lat) : Number((c.lat as unknown) ?? NaN);
      const lng = coords?.lng != null ? Number(coords.lng) : Number((c.lng as unknown) ?? NaN);
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
      const clinicId = String((c.clinicId as string) ?? (c._id as string) ?? '');
      return {
        id: clinicId,
        clinicId,
        veterinarianId: (c.veterinarianId as string) ?? (c.doctorId as string) ?? undefined,
        veterinarianName: (c.veterinarianName as string) ?? (c.doctorName as string) ?? undefined,
        clinicName: (c.clinicName as string) ?? (c.name as string) ?? undefined,
        address: (c.address as string) ?? undefined,
        city: (c.city as string) ?? undefined,
        phone: (c.phone as string) ?? undefined,
        distance: c.distance != null ? Number(c.distance) : undefined,
        coordinates: hasCoords ? { lat, lng } : undefined,
      } as ClinicMarker;
    })
    .filter((c) => !!c.id);
}

export function PetOwnerClinicMapScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const webViewRef = useRef<WebView>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [radius, setRadius] = useState(10);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<ClinicMarker | null>(null);
  const [showClinicModal, setShowClinicModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationPermission(false);
          Toast.show({
            type: 'error',
            text1: t('petOwnerClinicMap.toasts.permissionDenied.title'),
            text2: t('petOwnerClinicMap.toasts.permissionDenied.subtitle'),
          });
          setUserLocation({ lat: 40.7128, lng: -74.006 });
          return;
        }
        setLocationPermission(true);
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch {
        setLocationPermission(false);
        Toast.show({
          type: 'error',
          text1: t('petOwnerClinicMap.toasts.couldNotGetLocation.title'),
          text2: t('petOwnerClinicMap.toasts.couldNotGetLocation.subtitle'),
        });
        setUserLocation({ lat: 40.7128, lng: -74.006 });
      }
    })();
  }, []);

  const clinicsQuery = useNearbyClinics(userLocation?.lat, userLocation?.lng, radius, {
    enabled: !!userLocation,
  });

  const clinicMarkers = useMemo(
    () => normalizeNearbyClinics(clinicsQuery.data),
    [clinicsQuery.data]
  );

  const handleMarkerPress = (clinic: ClinicMarker) => {
    setSelectedClinic(clinic);
    setShowClinicModal(true);
    if (clinic.coordinates && webViewRef.current && mapLoaded) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'centerOnLocation',
          lat: clinic.coordinates.lat,
          lng: clinic.coordinates.lng,
        })
      );
    }
  };

  const handleRefreshLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      Toast.show({ type: 'success', text1: t('petOwnerClinicMap.toasts.locationUpdated') });
    } catch {
      Toast.show({ type: 'error', text1: t('petOwnerClinicMap.toasts.couldNotUpdateLocation') });
    }
  };

  const mapHTML = useMemo(() => {
    const center = userLocation || { lat: 40.7128, lng: -74.006 };
    const zoom = userLocation ? 12 : 10;

    const clinicFallback = String(t('petOwnerClinicMap.defaults.clinic'))
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const yourLocationLabel = String(t('petOwnerClinicMap.map.yourLocation'))
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const kmAwaySuffix = String(t('petOwnerClinicMap.map.kmAwaySuffix'))
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const clinicsData = clinicMarkers
      .filter((c) => !!c.coordinates)
      .map((c) => ({
        id: c.id,
        clinicName: c.clinicName,
        doctorName: c.veterinarianName,
        address: c.address,
        city: c.city,
        phone: c.phone,
        distance: c.distance,
        lat: c.coordinates!.lat,
        lng: c.coordinates!.lng,
      }));

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const userLocation = ${userLocation ? JSON.stringify(center) : 'null'};
    const clinics = ${JSON.stringify(clinicsData)};
    let map;
    let markers = [];
    let userMarker = null;

    function addClinicMarker(clinic) {
      if (!clinic.lat || !clinic.lng || isNaN(clinic.lat) || isNaN(clinic.lng)) return null;
      const clinicIcon = L.divIcon({
        className: 'custom-clinic-marker',
        html: '<div style="background-color:#0d6efd;width:40px;height:40px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:20px;">🏥</div>',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      const marker = L.marker([clinic.lat, clinic.lng], { icon: clinicIcon })
        .addTo(map)
        .bindPopup(
          '<div style="min-width:200px;">'
          + '<h6 style="margin:0 0 5px 0;font-weight:600;">' + (clinic.clinicName || '${clinicFallback}') + '</h6>'
          + '<p style="margin:0;font-size:13px;color:#666;">' + (clinic.doctorName || '') + '</p>'
          + '<p style="margin:5px 0;font-size:13px;color:#666;">' + (clinic.address || '') + (clinic.city ? ', ' + clinic.city : '') + '</p>'
          + (clinic.distance != null ? '<p style="margin:5px 0;font-size:12px;color:#0d6efd;font-weight:600;">' + Number(clinic.distance).toFixed(1) + ' ' + '${kmAwaySuffix}' + '</p>' : '')
          + '</div>'
        );

      marker.on('click', () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', clinicId: clinic.id }));
      });

      return marker;
    }

    function initMap() {
      const c = userLocation || { lat: 40.7128, lng: -74.006 };
      map = L.map('map').setView([c.lat, c.lng], ${zoom});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      if (userLocation) {
        const userIcon = L.divIcon({
          className: 'custom-user-marker',
          html: '<div style="background-color:#4285F4;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map).bindPopup('${yourLocationLabel}');
      }

      clinics.forEach((clinic) => {
        const m = addClinicMarker(clinic);
        if (m) markers.push(m);
      });

      if (markers.length > 0) {
        try {
          if (markers.length === 1) {
            const pos = markers[0].getLatLng();
            map.setView([pos.lat, pos.lng], 13);
          } else {
            const group = new L.FeatureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
          }
        } catch {
          // ignore
        }
      }

      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }

    initMap();

    window.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'centerOnLocation' && map) {
          map.setView([data.lat, data.lng], 14);
        } else if (data.type === 'updateLocation' && map) {
          if (userMarker) userMarker.setLatLng([data.lat, data.lng]);
          map.setView([data.lat, data.lng], 12);
        } else if (data.type === 'updateClinics' && map) {
          markers.forEach(m => map.removeLayer(m));
          markers = [];
          data.clinics.forEach((clinic) => {
            const m = addClinicMarker(clinic);
            if (m) markers.push(m);
          });
          if (markers.length > 0) {
            try {
              if (markers.length === 1) {
                const pos = markers[0].getLatLng();
                map.setView([pos.lat, pos.lng], 13);
              } else {
                const group = new L.FeatureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.1));
              }
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }
    });
  </script>
</body>
</html>
    `;
  }, [userLocation, clinicMarkers, radius, t]);

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setMapLoaded(true);
      } else if (data.type === 'markerClick') {
        const clinic = clinicMarkers.find((c) => c.id === data.clinicId);
        if (clinic) handleMarkerPress(clinic);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!mapLoaded || !webViewRef.current) return;
    const clinicsData = clinicMarkers
      .filter((c) => !!c.coordinates)
      .map((c) => ({
        id: c.id,
        clinicName: c.clinicName,
        doctorName: c.veterinarianName,
        address: c.address,
        city: c.city,
        phone: c.phone,
        distance: c.distance,
        lat: c.coordinates!.lat,
        lng: c.coordinates!.lng,
      }));
    webViewRef.current.postMessage(JSON.stringify({ type: 'updateClinics', clinics: clinicsData }));
  }, [clinicMarkers, mapLoaded]);

  const openVetProfile = () => {
    if (!selectedClinic?.veterinarianId) {
      Toast.show({ type: 'error', text1: t('petOwnerClinicMap.errors.vetInfoNotAvailable') });
      return;
    }
    setShowClinicModal(false);
    navigation.navigate('PetOwnerVetProfile', { vetId: String(selectedClinic.veterinarianId) });
  };

  const bookAppointment = () => {
    if (!selectedClinic?.veterinarianId) {
      Toast.show({ type: 'error', text1: t('petOwnerClinicMap.errors.vetInfoNotAvailable') });
      return;
    }
    setShowClinicModal(false);
    navigation.navigate('PetOwnerBooking', { vetId: String(selectedClinic.veterinarianId) });
  };

  const navigateToClinic = () => {
    if (!selectedClinic?.coordinates) {
      Toast.show({ type: 'error', text1: t('petOwnerClinicMap.errors.clinicCoordsNotAvailable') });
      return;
    }
    setShowClinicModal(false);
    navigation.navigate('PetOwnerClinicNavigation', {
      clinic: {
        name: selectedClinic.clinicName || t('petOwnerClinicMap.defaults.clinic'),
        address: [selectedClinic.address, selectedClinic.city].filter(Boolean).join(', '),
        phone: selectedClinic.phone,
        lat: selectedClinic.coordinates.lat,
        lng: selectedClinic.coordinates.lng,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        {userLocation ? (
          <WebView
            ref={webViewRef}
            source={{ html: mapHTML }}
            style={styles.map}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.mapPlaceholder}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.mapPlaceholderText}>{t('petOwnerClinicMap.map.loading')}</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.mapPlaceholderText}>{t('petOwnerClinicMap.map.gettingLocation')}</Text>
          </View>
        )}

        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleRefreshLocation} activeOpacity={0.7}>
            <Text style={styles.controlIcon}>⟳</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              if (userLocation && webViewRef.current) {
                webViewRef.current.postMessage(
                  JSON.stringify({ type: 'updateLocation', lat: userLocation.lat, lng: userLocation.lng })
                );
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.controlIcon}>⌖</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.radiusSelector}>
          <Text style={styles.radiusLabel}>{t('petOwnerClinicMap.radiusLabel', { value: radius })}</Text>
          <View style={styles.radiusButtons}>
            {[5, 10, 15, 20, 25].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusButton, radius === r && styles.radiusButtonActive]}
                onPress={() => setRadius(r)}
              >
                <Text style={[styles.radiusButtonText, radius === r && styles.radiusButtonTextActive]}>
                  {r}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {clinicsQuery.isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>{t('petOwnerClinicMap.loading.findingNearby')}</Text>
          </View>
        )}

        {!!clinicsQuery.error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{t('petOwnerClinicMap.errors.loadFailed')}</Text>
            <Button title={t('common.retry')} onPress={() => clinicsQuery.refetch()} />
          </View>
        )}
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            <Text style={styles.listCount}>{clinicMarkers.length}</Text> {t('petOwnerClinicMap.list.nearbyClinics')}
          </Text>
          {!locationPermission && (
            <View style={styles.permissionWarning}>
              <Text style={styles.permissionText}>{t('petOwnerClinicMap.list.locationDisabled')}</Text>
            </View>
          )}
        </View>

        {clinicsQuery.isLoading ? (
          <View style={styles.loadingList}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>{t('petOwnerClinicMap.loading.loadingClinics')}</Text>
          </View>
        ) : clinicMarkers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{t('petOwnerClinicMap.empty.title')}</Text>
            <Text style={styles.emptySub}>{t('petOwnerClinicMap.empty.subtitle')}</Text>
          </View>
        ) : (
          <FlatList
            data={clinicMarkers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.clinicItem} onPress={() => handleMarkerPress(item)} activeOpacity={0.7}>
                <View style={styles.clinicInfo}>
                  <Text style={styles.clinicName} numberOfLines={1}>
                    {item.clinicName || t('petOwnerClinicMap.defaults.clinic')}
                  </Text>
                  <Text style={styles.doctorName} numberOfLines={1}>
                    {item.veterinarianName || t('common.veterinarian')}
                  </Text>
                  <Text style={styles.clinicAddress} numberOfLines={1}>
                    📍 {[item.address, item.city].filter(Boolean).join(', ') || t('common.na')}
                  </Text>
                  {item.distance != null ? (
                    <Text style={styles.distanceText}>
                      {t('petOwnerClinicMap.distanceAway', { value: Number(item.distance).toFixed(1) })}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <Modal visible={showClinicModal} transparent animationType="slide" onRequestClose={() => setShowClinicModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedClinic?.clinicName || t('petOwnerClinicMap.defaults.clinic')}</Text>
              <TouchableOpacity onPress={() => setShowClinicModal(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>{t('petOwnerClinicMap.modal.labels.veterinarian')}</Text>
              <Text style={styles.modalText}>{selectedClinic?.veterinarianName || t('common.na')}</Text>
              <Text style={styles.modalLabel}>{t('petOwnerClinicMap.modal.labels.address')}</Text>
              <Text style={styles.modalText}>
                {[selectedClinic?.address, selectedClinic?.city].filter(Boolean).join(', ') || t('common.na')}
              </Text>
              {selectedClinic?.phone ? (
                <>
                  <Text style={styles.modalLabel}>{t('petOwnerClinicMap.modal.labels.phone')}</Text>
                  <Text style={styles.modalText}>{selectedClinic.phone}</Text>
                </>
              ) : null}
              {selectedClinic?.distance != null ? (
                <>
                  <Text style={styles.modalLabel}>{t('petOwnerClinicMap.modal.labels.distance')}</Text>
                  <Text style={styles.modalText}>
                    {t('petOwnerClinicMap.distanceAway', { value: Number(selectedClinic.distance).toFixed(1) })}
                  </Text>
                </>
              ) : null}
            </View>
            <View style={styles.modalActions}>
              <Button
                title={t('petOwnerClinicMap.modal.actions.viewVeterinarian')}
                variant="outline"
                onPress={openVetProfile}
                style={styles.modalBtn}
              />
              <Button title={t('petOwnerClinicMap.modal.actions.bookAppointment')} onPress={bookAppointment} style={styles.modalBtn} />
              <Button
                title={t('petOwnerClinicMap.modal.actions.navigate')}
                variant="outline"
                onPress={navigateToClinic}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  mapContainer: { height: 320, backgroundColor: '#fff' },
  map: { flex: 1 },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  mapPlaceholderText: { ...typography.bodySmall, color: colors.textSecondary },
  mapControls: { position: 'absolute', top: spacing.md, right: spacing.md, gap: spacing.sm },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  controlIcon: { fontSize: 18, color: colors.primary },
  radiusSelector: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  radiusLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  radiusButtons: { flexDirection: 'row', gap: spacing.xs },
  radiusButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  radiusButtonActive: { backgroundColor: colors.primary },
  radiusButtonText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  radiusButtonTextActive: { color: colors.textInverse },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  errorOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error + '55',
    gap: spacing.sm,
  },
  errorText: { ...typography.bodySmall, color: colors.error, textAlign: 'center' },
  listContainer: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  listTitle: { ...typography.h3 },
  listCount: { color: colors.primary },
  permissionWarning: { backgroundColor: colors.warning + '25', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  permissionText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  loadingList: { paddingVertical: spacing.lg, alignItems: 'center', gap: spacing.sm },
  emptyContainer: { paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.xs },
  emptyTitle: { ...typography.body, fontWeight: '700' },
  emptySub: { ...typography.bodySmall, color: colors.textSecondary },
  listContent: { paddingBottom: spacing.xxl },
  clinicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  clinicInfo: { flex: 1 },
  clinicName: { ...typography.body, fontWeight: '700' },
  doctorName: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  clinicAddress: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 6 },
  distanceText: { ...typography.caption, color: colors.primary, fontWeight: '600', marginTop: 6 },
  chevron: { ...typography.h2, color: colors.textLight },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.h3, flex: 1, paddingRight: spacing.md },
  closeIcon: { fontSize: 18, color: colors.textSecondary },
  modalBody: { gap: 6 },
  modalLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  modalText: { ...typography.body },
  modalActions: { marginTop: spacing.lg, gap: spacing.sm },
  modalBtn: { width: '100%' },
});
