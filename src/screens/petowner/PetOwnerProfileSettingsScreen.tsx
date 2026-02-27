import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useUserById, type UserProfile } from '../../queries/userQueries';
import { useUpdateUserProfile } from '../../mutations/userMutations';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { getImageUrl } from '../../config/api';
import { uploadProfileImage } from '../../services/upload';
import { copyToCacheUri, deleteCacheFiles, getExtensionFromMime } from '../../utils/fileUpload';
import { useTranslation } from 'react-i18next';

const GENDERS = [
  { value: '', labelKey: 'petOwnerProfileSettings.genders.select' },
  { value: 'MALE', labelKey: 'petOwnerProfileSettings.genders.male' },
  { value: 'FEMALE', labelKey: 'petOwnerProfileSettings.genders.female' },
  { value: 'OTHER', labelKey: 'petOwnerProfileSettings.genders.other' },
];

function toDateInput(d: string | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function PetOwnerProfileSettingsScreen() {
  const { user, updateUser } = useAuth();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const userId = user?.id ?? (user as { _id?: string })?._id;

  const { data: userResponse, isLoading } = useUserById(userId);
  const updateProfile = useUpdateUserProfile();

  const backendUser = (userResponse as { data?: UserProfile })?.data ?? (userResponse as UserProfile) ?? {};

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    profileImage: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    zip: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  });

  const [pendingProfileImage, setPendingProfileImage] = useState<{ uri: string; name: string; type?: string } | null>(null);
  const [pendingRemoveProfileImage, setPendingRemoveProfileImage] = useState(false);

  const showSettingsNav = false;

  useEffect(() => {
    if (!backendUser || !(backendUser._id || backendUser.id)) return;
    const addr = backendUser.address;
    const emergency = backendUser.emergencyContact;
    setForm({
      name: backendUser.name ?? '',
      phone: backendUser.phone ?? '',
      email: backendUser.email ?? '',
      dob: toDateInput(backendUser.dob as string),
      gender: backendUser.gender ?? '',
      bloodGroup: backendUser.bloodGroup ?? '',
      profileImage: backendUser.profileImage ?? '',
      addressLine1: addr?.line1 ?? '',
      addressLine2: addr?.line2 ?? '',
      city: addr?.city ?? '',
      state: addr?.state ?? '',
      country: addr?.country ?? '',
      zip: addr?.zip ?? '',
      emergencyName: emergency?.name ?? '',
      emergencyPhone: emergency?.phone ?? '',
      emergencyRelation: emergency?.relation ?? '',
    });

    setPendingProfileImage(null);
    setPendingRemoveProfileImage(false);
  }, [backendUser]);

  const update = (key: string) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];
      const mime = file.mimeType ?? 'application/octet-stream';
      const name = file.name ?? `image-${Date.now()}`;

      setPendingProfileImage({ uri: file.uri, name, type: mime });
      setPendingRemoveProfileImage(false);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? t('petOwnerProfileSettings.errors.uploadImageFailed');
      Alert.alert(t('common.error'), msg);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setPendingProfileImage(null);
      setPendingRemoveProfileImage(true);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? t('petOwnerProfileSettings.errors.removeImageFailed');
      Alert.alert(t('common.error'), msg);
    }
  };

  const handleSave = async () => {
    try {
      let nextProfileImage: string | null = form.profileImage || null;
      if (pendingRemoveProfileImage) nextProfileImage = null;

      if (pendingProfileImage) {
        const tempUris: string[] = [];
        let url: string | undefined;
        try {
          const mime = pendingProfileImage.type ?? 'image/jpeg';
          const name = pendingProfileImage.name ?? 'profile.jpg';
          const ext = getExtensionFromMime(mime);
          const uri = await copyToCacheUri(pendingProfileImage.uri, 0, ext);
          tempUris.push(uri);
          const res = await uploadProfileImage({ uri, name, type: mime });
          url = (res as { data?: { url?: string } })?.data?.url ?? (res as { url?: string })?.url;
        } finally {
          if (tempUris.length > 0) {
            await deleteCacheFiles(tempUris).catch(() => {});
          }
        }
        if (!url) {
          Alert.alert(t('common.error'), t('petOwnerProfileSettings.errors.uploadFailed'));
          return;
        }
        nextProfileImage = url;
      }

      const payload = {
        name: form.name,
        phone: form.phone || null,
        dob: form.dob || null,
        gender: form.gender || null,
        bloodGroup: form.bloodGroup || null,
        profileImage: nextProfileImage,
        address: {
          line1: form.addressLine1 || null,
          line2: form.addressLine2 || null,
          city: form.city || null,
          state: form.state || null,
          country: form.country || null,
          zip: form.zip || null,
        },
        emergencyContact: {
          name: form.emergencyName || null,
          phone: form.emergencyPhone || null,
          relation: form.emergencyRelation || null,
        },
      };

      const res = await updateProfile.mutateAsync(payload);
      const updated = (res as { data?: UserProfile })?.data;
      if (updated) {
        updateUser({ name: updated.name, phone: updated.phone, profileImage: updated.profileImage } as Partial<{ name: string; phone: string; profileImage: string }>);
        setForm((prev) => ({ ...prev, profileImage: updated.profileImage ?? '' }));
      }

      setPendingProfileImage(null);
      setPendingRemoveProfileImage(false);
      Alert.alert(t('common.success'), t('petOwnerProfileSettings.alerts.updated'));
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? t('petOwnerProfileSettings.errors.updateFailed');
      Alert.alert(t('common.error'), msg);
    }
  };

  const settingsNav = [
    { label: 'Profile', route: 'PetOwnerProfileSettings', active: true },
    { label: 'Change Password', route: 'PetOwnerChangePassword', active: false },
    { label: '2 Factor Authentication', route: 'PetOwnerTwoFactor', active: false },
    { label: 'Delete Account', route: 'PetOwnerDeleteAccount', active: false },
  ];

  return (
    <ScreenContainer scroll padded>
      {/* Settings navigation (same as VeterinaryFrontend) */}
      {showSettingsNav ? (
        <Card style={styles.navCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.settingsNav}>
              <TouchableOpacity
                style={[styles.settingsNavItem, styles.settingsNavItemActive]}
                onPress={() => {}}
              >
                <Text style={[styles.settingsNavText, styles.settingsNavTextActive]}>{t('petOwnerProfileSettings.settingsNav.profile')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsNavItem}
                onPress={() => navigation.navigate('PetOwnerChangePassword')}
              >
                <Text style={styles.settingsNavText}>{t('petOwnerProfileSettings.settingsNav.changePassword')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsNavItem}
                onPress={() => {}}
              >
                <Text style={styles.settingsNavText}>{t('petOwnerProfileSettings.settingsNav.twoFactor')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsNavItem} onPress={() => {}}>
                <Text style={styles.settingsNavText}>{t('petOwnerProfileSettings.settingsNav.deleteAccount')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>{t('petOwnerProfileSettings.title')}</Text>

        {/* Profile Photo */}
        <View style={styles.photoRow}>
          <View style={styles.avatarWrap}>
            {pendingRemoveProfileImage ? (
              <Text style={styles.avatarPlaceholder}>{t('petOwnerProfileSettings.photo.placeholder')}</Text>
            ) : pendingProfileImage?.uri ? (
              <Image source={{ uri: pendingProfileImage.uri }} style={styles.avatarImage} />
            ) : form.profileImage ? (
              <Image source={{ uri: getImageUrl(form.profileImage) ?? form.profileImage }} style={styles.avatarImage} />
            ) : form.name ? (
              <Text style={styles.avatarText}>{String(form.name).charAt(0).toUpperCase()}</Text>
            ) : (
              <Text style={styles.avatarPlaceholder}>{t('petOwnerProfileSettings.photo.placeholder')}</Text>
            )}
          </View>
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoBtn} onPress={handleUpload} disabled={updateProfile.isPending}>
              <Text style={styles.photoBtnText}>{t('profileSettings.choosePhoto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRemoveImage} disabled={updateProfile.isPending}>
              <Text style={styles.removeText}>{t('common.remove')}</Text>
            </TouchableOpacity>
            <Text style={styles.photoHint}>{t('profileSettings.photoHintPetOwner')}</Text>
          </View>
        </View>

        {/* Basic info row: Name, Gender, DOB */}
        <Input
          label={t('petOwnerProfileSettings.fields.name.label')}
          placeholder={t('petOwnerProfileSettings.fields.name.placeholder')}
          value={form.name}
          onChangeText={update('name')}
        />
        <Text style={styles.label}>{t('petOwnerProfileSettings.fields.gender.label')}</Text>
        <View style={styles.pickerWrap}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g.value || 'x'}
              style={[styles.pickerOption, form.gender === g.value && styles.pickerOptionActive]}
              onPress={() => update('gender')(g.value)}
            >
              <Text style={[styles.pickerOptionText, form.gender === g.value && styles.pickerOptionTextActive]}>
                {t(g.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Input
          label={t('petOwnerProfileSettings.fields.dob.label')}
          placeholder={t('petOwnerProfileSettings.fields.dob.placeholder')}
          value={form.dob}
          onChangeText={update('dob')}
        />

        {/* Phone, Email, Blood Group */}
        <Input
          label={t('petOwnerProfileSettings.fields.phone.label')}
          placeholder={t('petOwnerProfileSettings.fields.phone.placeholder')}
          value={form.phone}
          onChangeText={update('phone')}
          keyboardType="phone-pad"
        />
        <Input
          label={t('petOwnerProfileSettings.fields.email.label')}
          placeholder={t('petOwnerProfileSettings.fields.email.placeholder')}
          value={form.email}
          onChangeText={() => {}}
          editable={false}
        />
        <Input
          label={t('petOwnerProfileSettings.fields.bloodGroup.label')}
          placeholder={t('petOwnerProfileSettings.fields.bloodGroup.placeholder')}
          value={form.bloodGroup}
          onChangeText={update('bloodGroup')}
        />

        {/* Address Information */}
        <Text style={styles.subsectionTitle}>{t('petOwnerProfileSettings.sections.address')}</Text>
        <Input
          label={t('petOwnerProfileSettings.fields.addressLine1.label')}
          placeholder={t('petOwnerProfileSettings.fields.addressLine1.placeholder')}
          value={form.addressLine1}
          onChangeText={update('addressLine1')}
        />
        <Input
          label={t('petOwnerProfileSettings.fields.addressLine2.label')}
          placeholder={t('petOwnerProfileSettings.fields.addressLine2.placeholder')}
          value={form.addressLine2}
          onChangeText={update('addressLine2')}
        />
        <Input
          label={t('petOwnerProfileSettings.fields.city.label')}
          placeholder={t('petOwnerProfileSettings.fields.city.placeholder')}
          value={form.city}
          onChangeText={update('city')}
        />
        <Input
          label={t('petOwnerProfileSettings.fields.state.label')}
          placeholder={t('petOwnerProfileSettings.fields.state.placeholder')}
          value={form.state}
          onChangeText={update('state')}
        />
        <Input
          label={t('petOwnerProfileSettings.fields.country.label')}
          placeholder={t('petOwnerProfileSettings.fields.country.placeholder')}
          value={form.country}
          onChangeText={update('country')}
        />
        <Input
          label={t('petOwnerProfileSettings.fields.zip.label')}
          placeholder={t('petOwnerProfileSettings.fields.zip.placeholder')}
          value={form.zip}
          onChangeText={update('zip')}
          keyboardType="numeric"
        />

        {/* Emergency Contact */}
        <Text style={styles.subsectionTitle}>{t('petOwnerProfileSettings.sections.emergency')}</Text>
        <Input
          label={t('petOwnerProfileSettings.fields.emergencyName.label')}
          placeholder={t('petOwnerProfileSettings.fields.emergencyName.placeholder')}
          value={form.emergencyName}
          onChangeText={update('emergencyName')}
        />
        <Input
          label={t('petOwnerProfileSettings.fields.emergencyPhone.label')}
          placeholder={t('petOwnerProfileSettings.fields.emergencyPhone.placeholder')}
          value={form.emergencyPhone}
          onChangeText={update('emergencyPhone')}
          keyboardType="phone-pad"
        />
        <Input
          label={t('petOwnerProfileSettings.fields.emergencyRelation.label')}
          placeholder={t('petOwnerProfileSettings.fields.emergencyRelation.placeholder')}
          value={form.emergencyRelation}
          onChangeText={update('emergencyRelation')}
        />

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Button title={t('common.saveChanges')} onPress={handleSave} disabled={updateProfile.isPending} />
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navCard: { marginBottom: spacing.md },
  settingsNav: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  settingsNavItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
  },
  settingsNavItemActive: { backgroundColor: colors.primary },
  settingsNavText: { ...typography.body, color: colors.textSecondary },
  settingsNavTextActive: { color: colors.textInverse, fontWeight: '600' },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  subsectionTitle: { ...typography.body, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.sm },
  photoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
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
  loading: { paddingVertical: spacing.md, alignItems: 'center' },
  avatarPlaceholder: { ...typography.body, color: colors.textLight },
  photoActions: { marginLeft: spacing.lg },
  photoBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.primary, borderRadius: 8, alignSelf: 'flex-start' },
  photoBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },
  removeText: { ...typography.body, color: colors.error, marginTop: spacing.xs },
  photoHint: { ...typography.caption, color: colors.textLight, marginTop: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: 0 },
  flex1: { flex: 1 },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  pickerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.backgroundSecondary },
  pickerOptionActive: { backgroundColor: colors.primary },
  pickerOptionText: { ...typography.body },
  pickerOptionTextActive: { color: colors.textInverse },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: spacing.md, justifyContent: 'center' },
  cancelBtnText: { ...typography.body, color: colors.textSecondary },
});
