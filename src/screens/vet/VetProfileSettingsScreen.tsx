import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useVeterinarianProfile } from '../../queries/veterinarianQueries';
import { useUpdateVeterinarianProfile } from '../../mutations/veterinarianMutations';
import { uploadProfileImage } from '../../services/upload';
import { api } from '../../api/api';
import { API_ROUTES } from '../../api/apiConfig';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Toast from 'react-native-toast-message';
import { getImageUrl } from '../../config/api';
import { copyToCacheUri, deleteCacheFiles, getExtensionFromMime } from '../../utils/fileUpload';
import { useTranslation } from 'react-i18next';

const PROFILE_SECTIONS = [
  { key: 'basicDetails', screen: 'VetProfileSettings' as const },
  { key: 'specialtiesServices', screen: 'VetSpecialities' as const },
  { key: 'experience', screen: 'VetExperienceSettings' as const },
  { key: 'education', screen: 'VetEducationSettings' as const },
  { key: 'awards', screen: 'VetAwardsSettings' as const },
  { key: 'insurances', screen: 'VetInsuranceSettings' as const },
  { key: 'clinics', screen: 'VetClinicsSettings' as const },
  { key: 'businessHours', screen: 'VetBusinessSettings' as const },
];

export function VetProfileSettingsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { data: profileResponse, isLoading: profileLoading } = useVeterinarianProfile();
  const updateProfile = useUpdateVeterinarianProfile();

  const profile = useMemo(() => {
    const d = (profileResponse as { data?: Record<string, unknown> })?.data ?? profileResponse as Record<string, unknown>;
    return d ?? null;
  }, [profileResponse]);
  const profileUser = (profile?.userId as Record<string, unknown>) ?? user ?? {};

  const [profileImage, setProfileImage] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    title: '',
    biography: '',
    clinicFee: '',
    onlineFee: '',
    memberships: [''] as string[],
  });

  useEffect(() => {
    if (!profile && !profileUser) return;
    const img = (profileUser as { profileImage?: string })?.profileImage ?? '';
    setProfileImage(img);
    const fullName = (profileUser.name as string) || (user?.name as string) || '';
    const [first, ...rest] = fullName.split(' ');
    const last = rest.join(' ') || '';
    const fees = profile?.consultationFees as { clinic?: number; online?: number } | undefined;
    const memberships = Array.isArray(profile?.memberships)
      ? (profile.memberships as { name?: string }[]).map((m) => m?.name ?? '')
      : [];
    setForm({
      firstName: first || '',
      lastName: last || '',
      title: (profile?.title as string) ?? '',
      biography: (profile?.biography as string) ?? '',
      clinicFee: fees?.clinic != null ? String(fees.clinic) : '',
      onlineFee: fees?.online != null ? String(fees.online) : '',
      memberships: memberships.length > 0 ? memberships : [''],
    });
  }, [profile, profileUser?.name, user?.name]);

  const handleUploadPhoto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      setUploadingPhoto(true);
      const tempUris: string[] = [];
      let url: string | undefined;
      try {
        const mime = asset.mimeType ?? 'image/jpeg';
        const name = asset.name ?? 'profile.jpg';
        const ext = getExtensionFromMime(mime);
        const uri = await copyToCacheUri(asset.uri, 0, ext);
        tempUris.push(uri);
        const res = await uploadProfileImage({ uri, name, type: mime });
        url = (res as { data?: { url?: string } })?.data?.url ?? (res as { url?: string })?.url;
      } finally {
        if (tempUris.length > 0) {
          await deleteCacheFiles(tempUris).catch(() => {});
        }
        setUploadingPhoto(false);
      }
      if (!url) {
        Toast.show({ type: 'error', text1: t('vetProfileSettings.toasts.uploadFailed') });
        return;
      }
      await api.put(API_ROUTES.USERS.PROFILE, { profileImage: url });
      setProfileImage(url);
      Toast.show({ type: 'success', text1: t('vetProfileSettings.toasts.profileImageUpdated') });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: (err as { message?: string })?.message ?? t('vetProfileSettings.toasts.uploadFailedGeneric'),
      });
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await api.put(API_ROUTES.USERS.PROFILE, { profileImage: null });
      setProfileImage('');
      Toast.show({ type: 'success', text1: t('vetProfileSettings.toasts.profileImageRemoved') });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: (err as { message?: string })?.message ?? t('vetProfileSettings.toasts.removeFailedGeneric'),
      });
    }
  };

  const update = (key: string) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleMembershipChange = (index: number, value: string) => {
    setForm((prev) => {
      const next = [...prev.memberships];
      next[index] = value;
      return { ...prev, memberships: next };
    });
  };

  const addMembership = () => {
    setForm((prev) => ({ ...prev, memberships: [...prev.memberships, ''] }));
  };

  const removeMembership = (index: number) => {
    setForm((prev) => ({
      ...prev,
      memberships: prev.memberships.filter((_, i) => i !== index),
    }));
  };

  const displayName = `${form.firstName} ${form.lastName}`.trim();

  const handleSave = async () => {
    try {
      const name = displayName;
      if (name) {
        await api.put(API_ROUTES.USERS.PROFILE, { name });
      }
      await updateProfile.mutateAsync({
        title: form.title || undefined,
        biography: form.biography || undefined,
        consultationFees: {
          clinic: form.clinicFee !== '' && form.clinicFee != null ? Number(form.clinicFee) : null,
          online: form.onlineFee !== '' && form.onlineFee != null ? Number(form.onlineFee) : null,
        },
        memberships: form.memberships
          .map((m) => (m || '').trim())
          .filter(Boolean)
          .map((name) => ({ name })),
      });
      Toast.show({ type: 'success', text1: t('vetProfileSettings.toasts.profileUpdated') });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
          ?? (err as { message?: string })?.message
          ?? t('vetProfileSettings.toasts.updateFailedGeneric'),
      });
    }
  };

  if (profileLoading && !profile) {
    return (
      <ScreenContainer padded>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('vetProfileSettings.loading')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded>
      {/* Profile sections nav (same as VeterinaryFrontend DoctorProfileTabs) */}
      <Card style={styles.navCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabsRow}>
            {PROFILE_SECTIONS.map((s) => {
              const active = s.screen === 'VetProfileSettings';
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={active ? undefined : () => navigation.navigate(s.screen)}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {t(`vetProfileSettings.tabs.${s.key}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Card>

      <Card>
        {/* Profile Image */}
        <Text style={styles.sectionTitle}>{t('vetProfileSettings.sections.profileImage')}</Text>
        <View style={styles.photoRow}>
          <View style={styles.avatarWrap}>
            {profileImage ? (
              <Image source={{ uri: getImageUrl(profileImage) ?? profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {form.firstName ? String(form.firstName).charAt(0).toUpperCase() : 'V'}
              </Text>
            )}
          </View>
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoBtn} onPress={handleUploadPhoto} disabled={uploadingPhoto}>
              <Text style={styles.photoBtnText}>{uploadingPhoto ? t('vetProfileSettings.actions.uploading') : t('vetProfileSettings.actions.uploadPhoto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRemovePhoto} disabled={uploadingPhoto}>
              <Text style={styles.removeText}>{t('common.remove')}</Text>
            </TouchableOpacity>
            <Text style={styles.photoHint}>{t('vetProfileSettings.photoHint')}</Text>
          </View>
        </View>

        {/* Basic Information */}
        <Text style={styles.sectionTitle}>{t('vetProfileSettings.sections.basicInformation')}</Text>
        <Input
          label={t('vetProfileSettings.fields.firstName')}
          placeholder={t('vetProfileSettings.placeholders.firstName')}
          value={form.firstName}
          onChangeText={update('firstName')}
        />
        <Input
          label={t('vetProfileSettings.fields.lastName')}
          placeholder={t('vetProfileSettings.placeholders.lastName')}
          value={form.lastName}
          onChangeText={update('lastName')}
        />
        <Input
          label={t('vetProfileSettings.fields.displayName')}
          placeholder={t('vetProfileSettings.placeholders.displayName')}
          value={displayName}
          onChangeText={() => {}}
          editable={false}
        />
        <Input
          label={t('vetProfileSettings.fields.professionalTitle')}
          placeholder={t('vetProfileSettings.placeholders.professionalTitle')}
          value={form.title}
          onChangeText={update('title')}
        />
        <Input
          label={t('vetProfileSettings.fields.phone')}
          placeholder={t('vetProfileSettings.placeholders.phone')}
          value={user?.phone || ''}
          onChangeText={() => {}}
          editable={false}
        />
        <Input
          label={t('vetProfileSettings.fields.email')}
          placeholder={t('vetProfileSettings.placeholders.email')}
          value={user?.email || ''}
          onChangeText={() => {}}
          editable={false}
        />
        <Input
          label={t('vetProfileSettings.fields.biography')}
          placeholder={t('vetProfileSettings.placeholders.biography')}
          value={form.biography}
          onChangeText={update('biography')}
          style={styles.bioInput}
        />

        {/* Consultation Fees */}
        <Text style={styles.sectionTitle}>{t('vetProfileSettings.sections.consultationFees')}</Text>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Input
              label={t('vetProfileSettings.fields.inClinicFee')}
              placeholder={t('vetProfileSettings.placeholders.feeExample', { value: 50 })}
              value={form.clinicFee}
              onChangeText={update('clinicFee')}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label={t('vetProfileSettings.fields.onlineFee')}
              placeholder={t('vetProfileSettings.placeholders.feeExample', { value: 40 })}
              value={form.onlineFee}
              onChangeText={update('onlineFee')}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Professional Memberships */}
        <Text style={styles.sectionTitle}>{t('vetProfileSettings.sections.professionalMemberships')}</Text>
        {form.memberships.map((value, index) => (
          <View key={index} style={styles.membershipRow}>
            <View style={styles.membershipInputWrap}>
              <Input
                label={index === 0 ? t('vetProfileSettings.fields.organization') : undefined}
                placeholder={t('vetProfileSettings.placeholders.organizationExample', { value: 'AVMA' })}
                value={value}
                onChangeText={(v) => handleMembershipChange(index, v)}
              />
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeMembership(index)}
            >
              <Text style={styles.removeBtnText}>{t('common.remove')}</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addMembershipBtn} onPress={addMembership}>
          <Text style={styles.addMembershipText}>{t('vetProfileSettings.actions.addMembership')}</Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Button
            title={updateProfile.isPending ? t('vetProfileSettings.actions.saving') : t('common.saveChanges')}
            onPress={handleSave}
            disabled={updateProfile.isPending}
          />
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  navCard: { marginBottom: spacing.md },
  tabsRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.body, color: colors.textSecondary },
  tabTextActive: { color: colors.textInverse, fontWeight: '600' },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm, marginTop: spacing.sm },
  photoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { ...typography.h2, color: colors.primary },
  photoActions: { marginLeft: spacing.lg },
  photoBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  photoBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },
  removeText: { ...typography.body, color: colors.error, marginTop: spacing.xs },
  photoHint: { ...typography.caption, color: colors.textLight, marginTop: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex1: { flex: 1 },
  bioInput: { minHeight: 80 },
  membershipRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  membershipInputWrap: { flex: 1 },
  removeBtn: { paddingBottom: spacing.md },
  removeBtnText: { ...typography.body, color: colors.error },
  addMembershipBtn: { marginTop: spacing.sm },
  addMembershipText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: spacing.md, justifyContent: 'center' },
  cancelBtnText: { ...typography.body, color: colors.textSecondary },
});
