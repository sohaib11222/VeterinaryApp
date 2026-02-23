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
import { useUpdateUserProfile, useUploadProfileImage } from '../../mutations/userMutations';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { getImageUrl } from '../../config/api';

const GENDERS = [
  { value: '', label: 'Select' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
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
  const userId = user?.id ?? (user as { _id?: string })?._id;

  const { data: userResponse, isLoading } = useUserById(userId);
  const updateProfile = useUpdateUserProfile();
  const uploadProfileImage = useUploadProfileImage();

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
  }, [backendUser]);

  const update = (key: string) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];
      const res = await uploadProfileImage.mutateAsync(file as unknown as File);
      const url = (res as { data?: { url?: string } })?.data?.url;
      if (!url) {
        Alert.alert('Error', 'Upload failed');
        return;
      }
      setForm((prev) => ({ ...prev, profileImage: url }));
      const updateRes = await updateProfile.mutateAsync({ profileImage: url });
      const updated = (updateRes as { data?: UserProfile })?.data;
      if (updated) {
        updateUser({ name: updated.name, phone: updated.phone, profileImage: updated.profileImage } as Partial<{ name: string; phone: string; profileImage: string }>);
      }
      Alert.alert('Success', 'Profile image updated');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Failed to upload image';
      Alert.alert('Error', msg);
    }
  };

  const handleRemoveImage = async () => {
    try {
      const updateRes = await updateProfile.mutateAsync({ profileImage: null });
      setForm((prev) => ({ ...prev, profileImage: '' }));
      const updated = (updateRes as { data?: UserProfile })?.data;
      if (updated) updateUser({ name: updated.name, phone: updated.phone, profileImage: updated.profileImage } as Partial<{ name: string; phone: string; profileImage: string }>);
      Alert.alert('Success', 'Profile image removed');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Failed to remove image';
      Alert.alert('Error', msg);
    }
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      phone: form.phone || null,
      dob: form.dob || null,
      gender: form.gender || null,
      bloodGroup: form.bloodGroup || null,
      profileImage: form.profileImage || null,
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
    try {
      const res = await updateProfile.mutateAsync(payload);
      const updated = (res as { data?: UserProfile })?.data;
      if (updated) updateUser({ name: updated.name, phone: updated.phone, profileImage: updated.profileImage } as Partial<{ name: string; phone: string; profileImage: string }>);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Failed to update profile';
      Alert.alert('Error', msg);
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
      <Card style={styles.navCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.settingsNav}>
            <TouchableOpacity
              style={[styles.settingsNavItem, styles.settingsNavItemActive]}
              onPress={() => {}}
            >
              <Text style={[styles.settingsNavText, styles.settingsNavTextActive]}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsNavItem}
              onPress={() => navigation.navigate('PetOwnerChangePassword')}
            >
              <Text style={styles.settingsNavText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsNavItem}
              onPress={() => {}}
            >
              <Text style={styles.settingsNavText}>2 Factor Authentication</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsNavItem} onPress={() => {}}>
              <Text style={styles.settingsNavText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Profile Settings</Text>

        {/* Profile Photo */}
        <View style={styles.photoRow}>
          <View style={styles.avatarWrap}>
            {form.profileImage ? (
              <Image source={{ uri: getImageUrl(form.profileImage) ?? form.profileImage }} style={styles.avatarImage} />
            ) : form.name ? (
              <Text style={styles.avatarText}>{String(form.name).charAt(0).toUpperCase()}</Text>
            ) : (
              <Text style={styles.avatarPlaceholder}>Photo</Text>
            )}
          </View>
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoBtn} onPress={handleUpload} disabled={uploadProfileImage.isPending || updateProfile.isPending}>
              <Text style={styles.photoBtnText}>{uploadProfileImage.isPending ? 'Uploading...' : 'Upload New'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRemoveImage} disabled={updateProfile.isPending}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Image below 4 MB, jpg, png, svg</Text>
          </View>
        </View>

        {/* Basic info row: Name, Gender, DOB */}
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Input
              label="First Name *"
              placeholder="Enter your name"
              value={form.name}
              onChangeText={update('name')}
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerWrap}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g.value || 'x'}
                  style={[
                    styles.pickerOption,
                    form.gender === g.value && styles.pickerOptionActive,
                  ]}
                  onPress={() => update('gender')(g.value)}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      form.gender === g.value && styles.pickerOptionTextActive,
                    ]}
                  >
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.flex1}>
            <Input
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              value={form.dob}
              onChangeText={update('dob')}
            />
          </View>
        </View>

        {/* Phone, Email, Blood Group */}
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Input
              label="Phone Number"
              placeholder="Enter phone"
              value={form.phone}
              onChangeText={update('phone')}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="Email Address"
              placeholder="Email"
              value={form.email}
              editable={false}
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="Blood Group"
              placeholder="e.g. O+"
              value={form.bloodGroup}
              onChangeText={update('bloodGroup')}
            />
          </View>
        </View>

        {/* Address Information */}
        <Text style={styles.subsectionTitle}>Address Information</Text>
        <Input
          label="Address *"
          placeholder="Enter your address"
          value={form.addressLine1}
          onChangeText={update('addressLine1')}
        />
        <Input
          label="Address Line 2"
          placeholder="Apartment, suite, etc."
          value={form.addressLine2}
          onChangeText={update('addressLine2')}
        />
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Input
              label="City"
              placeholder="City"
              value={form.city}
              onChangeText={update('city')}
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="State"
              placeholder="State"
              value={form.state}
              onChangeText={update('state')}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Input
              label="Country"
              placeholder="Country"
              value={form.country}
              onChangeText={update('country')}
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="Pincode"
              placeholder="Pincode"
              value={form.zip}
              onChangeText={update('zip')}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Emergency Contact */}
        <Text style={styles.subsectionTitle}>Emergency Contact</Text>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Input
              label="Name"
              placeholder="Emergency contact name"
              value={form.emergencyName}
              onChangeText={update('emergencyName')}
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="Phone"
              placeholder="Emergency contact phone"
              value={form.emergencyPhone}
              onChangeText={update('emergencyPhone')}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="Relation"
              placeholder="Relation"
              value={form.emergencyRelation}
              onChangeText={update('emergencyRelation')}
            />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Button title="Save Changes" onPress={handleSave} disabled={updateProfile.isPending} />
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
