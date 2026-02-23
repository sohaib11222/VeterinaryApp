import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useVeterinarianProfile } from '../../queries/veterinarianQueries';
import { useUpdateVeterinarianProfile } from '../../mutations/veterinarianMutations';
import { api } from '../../api/api';
import { API_ROUTES } from '../../api/apiConfig';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Toast from 'react-native-toast-message';

const PROFILE_SECTIONS = [
  { label: 'Basic Details', screen: 'VetProfileSettings' as const },
  { label: 'Specialties & Services', screen: 'VetSpecialities' as const },
  { label: 'Experience', screen: 'VetExperienceSettings' as const },
  { label: 'Education', screen: 'VetEducationSettings' as const },
  { label: 'Awards', screen: 'VetAwardsSettings' as const },
  { label: 'Insurances', screen: 'VetInsuranceSettings' as const },
  { label: 'Clinics', screen: 'VetClinicsSettings' as const },
  { label: 'Business Hours', screen: 'VetBusinessSettings' as const },
];

export function VetProfileSettingsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { data: profileResponse, isLoading: profileLoading } = useVeterinarianProfile();
  const updateProfile = useUpdateVeterinarianProfile();

  const profile = useMemo(() => {
    const d = (profileResponse as { data?: Record<string, unknown> })?.data ?? profileResponse as Record<string, unknown>;
    return d ?? null;
  }, [profileResponse]);
  const profileUser = (profile?.userId as Record<string, unknown>) ?? user ?? {};

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
      Toast.show({ type: 'success', text1: 'Profile updated successfully' });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
          ?? (err as { message?: string })?.message
          ?? 'Failed to update profile',
      });
    }
  };

  if (profileLoading && !profile) {
    return (
      <ScreenContainer padded>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
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
            <TouchableOpacity style={[styles.tab, styles.tabActive]}>
              <Text style={[styles.tabText, styles.tabTextActive]}>Basic Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => navigation.navigate('VetSpecialities')}
            >
              <Text style={styles.tabText}>Specialties & Services</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => navigation.navigate('VetExperienceSettings')}
            >
              <Text style={styles.tabText}>Experience</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => navigation.navigate('VetEducationSettings')}
            >
              <Text style={styles.tabText}>Education</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => navigation.navigate('VetAwardsSettings')}
            >
              <Text style={styles.tabText}>Awards</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => navigation.navigate('VetInsuranceSettings')}
            >
              <Text style={styles.tabText}>Insurances</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => navigation.navigate('VetClinicsSettings')}
            >
              <Text style={styles.tabText}>Clinics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => navigation.navigate('VetBusinessSettings')}
            >
              <Text style={styles.tabText}>Business Hours</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Card>

      <Card>
        {/* Profile Image */}
        <Text style={styles.sectionTitle}>Profile Image</Text>
        <View style={styles.photoRow}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {form.firstName ? String(form.firstName).charAt(0).toUpperCase() : 'V'}
            </Text>
          </View>
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoBtn}>
              <Text style={styles.photoBtnText}>Upload Photo</Text>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Below 4MB, JPG, PNG, SVG</Text>
          </View>
        </View>

        {/* Basic Information */}
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Input
              label="First Name *"
              placeholder="First name"
              value={form.firstName}
              onChangeText={update('firstName')}
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="Last Name *"
              placeholder="Last name"
              value={form.lastName}
              onChangeText={update('lastName')}
            />
          </View>
        </View>
        <Input
          label="Display Name *"
          placeholder="How you want to be known"
          value={displayName}
          editable={false}
        />
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Input
              label="Professional Title *"
              placeholder="e.g. DVM, Veterinarian"
              value={form.title}
              onChangeText={update('title')}
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="Phone Number *"
              placeholder="Phone"
              value={user?.phone || ''}
              editable={false}
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="Email Address *"
              placeholder="Email"
              value={user?.email || ''}
              editable={false}
            />
          </View>
        </View>
        <Input
          label="Biography"
          placeholder="Describe your veterinary background, expertise..."
          value={form.biography}
          onChangeText={update('biography')}
          style={styles.bioInput}
        />

        {/* Consultation Fees */}
        <Text style={styles.sectionTitle}>Consultation Fees</Text>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Input
              label="In-Clinic Consultation Fee"
              placeholder="e.g. 50"
              value={form.clinicFee}
              onChangeText={update('clinicFee')}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="Online Consultation Fee"
              placeholder="e.g. 40"
              value={form.onlineFee}
              onChangeText={update('onlineFee')}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Professional Memberships */}
        <Text style={styles.sectionTitle}>Professional Memberships</Text>
        {form.memberships.map((value, index) => (
          <View key={index} style={styles.membershipRow}>
            <View style={styles.membershipInputWrap}>
              <Input
                label={index === 0 ? 'Organization' : undefined}
                placeholder="e.g. AVMA"
                value={value}
                onChangeText={(v) => handleMembershipChange(index, v)}
              />
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeMembership(index)}
            >
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addMembershipBtn} onPress={addMembership}>
          <Text style={styles.addMembershipText}>+ Add Membership</Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Button
            title={updateProfile.isPending ? 'Saving...' : 'Save Changes'}
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
  },
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
