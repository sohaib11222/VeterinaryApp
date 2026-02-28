import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useMyPetStore } from '../../queries/petStoreQueries';
import { useUpdatePetStore, useCreatePetStore } from '../../mutations/petStoreMutations';
import { uploadPetStoreLogo } from '../../services/upload';
import { copyToCacheUri, deleteCacheFiles, getExtensionFromMime } from '../../utils/fileUpload';
import { getImageUrl } from '../../config/api';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';

function extractPetStore(payload: unknown): any {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  return (outer as { data?: unknown })?.data ?? outer;
}

export function PharmacyProfileScreen() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useMyPetStore();
  const updateMutation = useUpdatePetStore();
  const createMutation = useCreatePetStore();
  const petStore = extractPetStore(data);
  const petStoreId = petStore?._id ?? petStore?.id;

  const [form, setForm] = useState({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: '',
    zip: '',
    logo: '',
    isActive: true,
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!petStore) return;
    const addr = petStore?.address ?? {};
    setForm({
      name: petStore?.name ?? '',
      phone: petStore?.phone ?? '',
      line1: addr?.line1 ?? '',
      line2: addr?.line2 ?? '',
      city: addr?.city ?? '',
      state: addr?.state ?? '',
      country: addr?.country ?? '',
      zip: addr?.zip ?? '',
      logo: petStore?.logo ?? '',
      isActive: petStore?.isActive !== false,
    });
  }, [petStore]);

  const update = (key: string) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const pickAndUploadLogo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      setUploadingLogo(true);
      const tempUris: string[] = [];
      try {
        const mime = asset.mimeType ?? 'image/jpeg';
        const name = asset.name ?? 'logo.jpg';
        const ext = getExtensionFromMime(mime);
        const uri = await copyToCacheUri(asset.uri, 0, ext);
        tempUris.push(uri);
        const res = await uploadPetStoreLogo({
          uri,
          name,
          type: mime,
        });
        const url = (res as { data?: { url?: string } })?.data?.url ?? (res as { url?: string })?.url;
        if (url) {
          update('logo')(url);
          Toast.show({ type: 'success', text1: t('pharmacyProfile.toasts.logoUploaded') });
        }
      } finally {
        if (tempUris.length > 0) {
          await deleteCacheFiles(tempUris).catch(() => {});
        }
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: t('pharmacyProfile.errors.uploadFailedTitle'), text2: getErrorMessage(err, t('pharmacyProfile.errors.couldNotUploadLogo')) });
    } finally {
      setUploadingLogo(false);
    }
  };

  const onSave = async () => {
    const payload = {
      name: form.name.trim() || undefined,
      phone: form.phone.trim() || undefined,
      logo: form.logo || undefined,
      address: {
        line1: form.line1.trim() || undefined,
        line2: form.line2.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        country: form.country.trim() || undefined,
        zip: form.zip.trim() || undefined,
      },
      isActive: form.isActive,
    };
    try {
      if (petStoreId) {
        await updateMutation.mutateAsync({ petStoreId: String(petStoreId), data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      Toast.show({ type: 'success', text1: t('pharmacyProfile.toasts.profileSaved') });
    } catch (err) {
      Toast.show({ type: 'error', text1: t('common.failed'), text2: getErrorMessage(err, t('pharmacyProfile.errors.couldNotSaveProfile')) });
    }
  };

  if (isLoading && !petStore) {
    return (
      <ScreenContainer padded>
        <View style={styles.loadingRow}><ActivityIndicator size="small" color={colors.primary} /></View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.sectionTitle}>{t('pharmacyProfile.title')}</Text>
        <View style={styles.logoRow}>
          {form.logo ? (
            <Image source={{ uri: getImageUrl(form.logo) ?? form.logo }} style={styles.logoImg} />
          ) : (
            <View style={styles.logoPlaceholder} />
          )}
          <TouchableOpacity onPress={pickAndUploadLogo} disabled={uploadingLogo}>
            <Text style={styles.uploadText}>{uploadingLogo ? t('pharmacyProfile.actions.uploading') : t('pharmacyProfile.actions.uploadLogo')}</Text>
          </TouchableOpacity>
        </View>
        <Input label={t('pharmacyProfile.fields.storeName')} value={form.name} onChangeText={update('name')} />
        <Input label={t('pharmacyProfile.fields.phone')} value={form.phone} onChangeText={update('phone')} keyboardType="phone-pad" />
        <Text style={styles.subsectionTitle}>{t('pharmacyProfile.sections.address')}</Text>
        <Input label={t('pharmacyProfile.fields.addressLine1')} value={form.line1} onChangeText={update('line1')} />
        <Input label={t('pharmacyProfile.fields.addressLine2')} value={form.line2} onChangeText={update('line2')} />
        <View style={styles.row}>
          <View style={styles.half}><Input label={t('pharmacyProfile.fields.city')} value={form.city} onChangeText={update('city')} /></View>
          <View style={styles.half}><Input label={t('pharmacyProfile.fields.state')} value={form.state} onChangeText={update('state')} /></View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}><Input label={t('pharmacyProfile.fields.country')} value={form.country} onChangeText={update('country')} /></View>
          <View style={styles.half}><Input label={t('pharmacyProfile.fields.zip')} value={form.zip} onChangeText={update('zip')} keyboardType="numeric" /></View>
        </View>
        <Button title={t('common.saveChanges')} onPress={onSave} loading={updateMutation.isPending || createMutation.isPending} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingRow: { padding: spacing.xl, alignItems: 'center' },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  logoPlaceholder: { width: 80, height: 80, borderRadius: 8, backgroundColor: colors.backgroundTertiary },
  logoImg: { width: 80, height: 80, borderRadius: 8 },
  uploadText: { ...typography.bodySmall, color: colors.primary, marginLeft: spacing.sm },
  subsectionTitle: { ...typography.body, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
});
