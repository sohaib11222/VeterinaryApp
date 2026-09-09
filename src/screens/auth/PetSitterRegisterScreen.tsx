import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { AuthLayout, AuthUploadField } from '../../components/common/AuthLayout';
import { Button } from '../../components/common/Button';
import { CountryPhoneInput } from '../../components/common/CountryPhoneInput';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { getErrorMessage } from '../../utils/errorUtils';

type PickedFile = { uri: string; name: string; mimeType?: string | null };
const GENDER_VALUES = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;
const toIsoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const toDate = (value?: string) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : null;

export function PetSitterRegisterScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { registerPetSitter } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<PickedFile | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', dob: '', gender: '', city: '', province: '', region: '', address: '', password: '', confirmPassword: '' });
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  const genders = GENDER_VALUES.map((value) => ({ value, label: t(`petSitter.registration.${value === 'PREFER_NOT_TO_SAY' ? 'preferNot' : value.toLowerCase()}`) }));
  const selectedGender = genders.find((item) => item.value === form.gender)?.label;

  const chooseProfilePhoto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) setProfilePhoto(result.assets[0]);
    } catch { Toast.show({ type: 'error', text1: t('petSitter.registration.photoError') }); }
  };

  const validate = () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.password || !profilePhoto) { Toast.show({ type: 'error', text1: t('petSitter.registration.requiredError') }); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { Toast.show({ type: 'error', text1: t('petSitter.registration.emailError') }); return false; }
    if (!/^\+\d{7,18}$/.test(form.phone.trim())) { Toast.show({ type: 'error', text1: t('petSitter.registration.phoneError') }); return false; }
    if (form.password.length < 6 || form.password !== form.confirmPassword) { Toast.show({ type: 'error', text1: t('petSitter.registration.passwordError') }); return false; }
    return true;
  };

  const submit = async () => {
    if (!validate() || !profilePhoto) return;
    setSubmitting(true);
    try {
      // This is stage 1 from the website. The verified session must complete the care profile next.
      const data = new FormData();
      Object.entries({
        name: form.fullName.trim(), fullName: form.fullName.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(), password: form.password,
        dob: form.dob || '', gender: form.gender || '', city: form.city.trim(), province: form.province.trim(), region: form.region.trim(), address: form.address.trim(),
        experienceYears: '0', bio: '', petSittingExperience: '', certifications: '[]', petTypes: '[]', servicesOffered: '[]', availability: '[]',
      }).forEach(([key, value]) => data.append(key, value));
      data.append('file', { uri: profilePhoto.uri, name: profilePhoto.name || 'profile.jpg', type: profilePhoto.mimeType || 'image/jpeg' } as any);
      const result = await registerPetSitter(data);
      if (result?.requiresEmailVerification) navigation.replace('VerifyEmail', { email: result.email || form.email.trim().toLowerCase() });
    } catch (error) { Toast.show({ type: 'error', text1: t('petSitter.registration.createError'), text2: getErrorMessage(error, t('petSitter.registration.retryDetails')) }); }
    finally { setSubmitting(false); }
  };

  return <AuthLayout icon="home-heart" eyebrow={t('petSitter.registration.eyebrow')} title={t('petSitter.registration.title')} subtitle={t('petSitter.registration.subtitle')} progress={{ current: 1, total: 4 }} footer={<TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backLink}>{t('petSitter.registration.alreadyRegistered')}</Text></TouchableOpacity>}>
    <AuthUploadField label={t('petSitter.registration.photo')} required selectedFileName={profilePhoto?.name} onPress={chooseProfilePhoto} />
    <Input label={t('petSitter.registration.fullName')} value={form.fullName} onChangeText={set('fullName')} placeholder={t('petSitter.registration.fullName')} autoCapitalize="words" />
    <Input label={t('petSitter.registration.email')} value={form.email} onChangeText={set('email')} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
    <CountryPhoneInput label={t('petSitter.registration.phone')} value={form.phone} onChangeText={set('phone')} helperText={t('petSitter.registration.phoneHelper')} />
    <View style={styles.row}><View style={styles.half}><DateField label={t('petSitter.registration.dateOfBirth')} placeholder={t('petSitter.registration.chooseDate')} value={form.dob} onPress={() => setCalendarOpen(true)} /></View><View style={styles.half}><SelectorField label={t('petSitter.registration.gender')} placeholder={t('petSitter.registration.selectGender')} value={selectedGender} onPress={() => setGenderOpen(true)} /></View></View>
    <Input label={t('petSitter.registration.address')} value={form.address} onChangeText={set('address')} placeholder={t('petSitter.registration.address')} />
    <View style={styles.row}><View style={styles.half}><Input label={t('petSitter.registration.city')} value={form.city} onChangeText={set('city')} placeholder={t('petSitter.registration.city')} /></View><View style={styles.half}><Input label={t('petSitter.registration.province')} value={form.province} onChangeText={set('province')} placeholder={t('petSitter.registration.province')} /></View></View>
    <Input label={t('petSitter.registration.country')} value={form.region} onChangeText={set('region')} placeholder={t('petSitter.registration.country')} />
    <Input label={t('petSitter.registration.password')} value={form.password} onChangeText={set('password')} placeholder={t('petSitter.registration.password')} secureTextEntry />
    <Input label={t('petSitter.registration.confirmPassword')} value={form.confirmPassword} onChangeText={set('confirmPassword')} placeholder={t('petSitter.registration.confirmPassword')} secureTextEntry />
    <Button title={t('petSitter.registration.continue')} onPress={submit} loading={submitting} disabled={submitting} icon={<Ionicons name="mail-outline" size={19} color={colors.textInverse} />} />
    <CalendarModal visible={calendarOpen} value={form.dob} onClose={() => setCalendarOpen(false)} onSelect={(value) => { set('dob')(value); setCalendarOpen(false); }} />
    <ChoiceModal visible={genderOpen} title={t('petSitter.registration.selectGenderTitle')} options={genders} value={form.gender} onClose={() => setGenderOpen(false)} onSelect={(value) => { set('gender')(value); setGenderOpen(false); }} />
  </AuthLayout>;
}

function DateField({ label, placeholder, value, onPress }: { label: string; placeholder: string; value: string; onPress: () => void }) { return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TouchableOpacity onPress={onPress} style={styles.selector}><Text style={[styles.selectorText, !value && styles.selectorPlaceholder]}>{value ? toDate(value)?.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : placeholder}</Text><Ionicons name="calendar-outline" size={19} color={colors.primary} /></TouchableOpacity></View>; }
function SelectorField({ label, placeholder, value, onPress }: { label: string; placeholder: string; value?: string; onPress: () => void }) { return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TouchableOpacity onPress={onPress} style={styles.selector}><Text style={[styles.selectorText, !value && styles.selectorPlaceholder]}>{value || placeholder}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} /></TouchableOpacity></View>; }
function ChoiceModal({ visible, title, options, value, onClose, onSelect }: { visible: boolean; title: string; options: { value: string; label: string }[]; value: string; onClose: () => void; onSelect: (value: string) => void }) { return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable style={styles.overlay} onPress={onClose}><Pressable style={styles.modal} onPress={(event) => event.stopPropagation()}><Text style={styles.modalTitle}>{title}</Text>{options.map((option) => <TouchableOpacity key={option.value} style={styles.choice} onPress={() => onSelect(option.value)}><Text style={styles.choiceText}>{option.label}</Text><Ionicons name={value === option.value ? 'radio-button-on' : 'radio-button-off'} size={20} color={value === option.value ? colors.primary : colors.textLight} /></TouchableOpacity>)}</Pressable></Pressable></Modal>; }

function CalendarModal({ visible, value, onClose, onSelect }: { visible: boolean; value: string; onClose: () => void; onSelect: (value: string) => void }) {
  const { t, i18n } = useTranslation();
  const [month, setMonth] = useState(() => toDate(value) ?? new Date(new Date().getFullYear() - 18, new Date().getMonth(), 1));
  const selected = toDate(value); const today = new Date(); today.setHours(23, 59, 59, 999);
  const days = useMemo(() => { const first = new Date(month.getFullYear(), month.getMonth(), 1); const blanks = Array.from({ length: first.getDay() }, () => null as Date | null); const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); return [...blanks, ...Array.from({ length: count }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))]; }, [month]);
  const previous = () => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)); const next = () => { const candidate = new Date(month.getFullYear(), month.getMonth() + 1, 1); if (candidate <= new Date(today.getFullYear(), today.getMonth(), 1)) setMonth(candidate); };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable style={styles.overlay} onPress={onClose}><Pressable style={styles.calendar} onPress={(event) => event.stopPropagation()}><View style={styles.calendarHead}><TouchableOpacity onPress={previous} style={styles.monthButton}><Ionicons name="chevron-back" size={20} color={colors.primary} /></TouchableOpacity><Text style={styles.modalTitle}>{month.toLocaleDateString(i18n.language.startsWith('it') ? 'it-IT' : undefined, { month: 'long', year: 'numeric' })}</Text><TouchableOpacity onPress={next} style={styles.monthButton}><Ionicons name="chevron-forward" size={20} color={colors.primary} /></TouchableOpacity></View><View style={styles.week}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((item, index) => <Text key={`${item}-${index}`} style={styles.weekday}>{item}</Text>)}</View><View style={styles.dayGrid}>{days.map((day, index) => { if (!day) return <View key={`blank-${index}`} style={styles.day} />; const picked = selected && toIsoDate(day) === toIsoDate(selected); const disabled = day > today; return <TouchableOpacity key={toIsoDate(day)} disabled={disabled} onPress={() => onSelect(toIsoDate(day))} style={[styles.day, picked && styles.daySelected]}><Text style={[styles.dayText, picked && styles.dayTextSelected, disabled && styles.dayDisabled]}>{day.getDate()}</Text></TouchableOpacity>; })}</View><TouchableOpacity style={styles.closeCalendar} onPress={onClose}><Text style={styles.closeCalendarText}>{t('petSitter.registration.cancel')}</Text></TouchableOpacity></Pressable></Pressable></Modal>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: spacing.sm }, half: { flex: 1 }, field: { flex: 1, marginBottom: spacing.md }, fieldLabel: { ...typography.label, color: colors.primaryDark, marginBottom: 7 }, selector: { minHeight: 49, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.background, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, selectorText: { ...typography.bodySmall, color: colors.text }, selectorPlaceholder: { color: colors.textLight }, overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, backgroundColor: 'rgba(8, 37, 30, 0.48)' }, modal: { width: '100%', maxWidth: 360, borderRadius: 20, backgroundColor: colors.background, padding: spacing.lg }, modalTitle: { ...typography.h3, color: colors.primaryDark, textAlign: 'center' }, choice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.borderLight }, choiceText: { ...typography.body, color: colors.text }, calendar: { width: '100%', maxWidth: 370, borderRadius: 20, backgroundColor: colors.background, padding: spacing.lg }, calendarHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }, monthButton: { height: 38, width: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '19' }, week: { flexDirection: 'row', marginBottom: 5 }, weekday: { width: '14.2857%', textAlign: 'center', ...typography.caption, color: colors.textSecondary, fontWeight: '800' }, dayGrid: { flexDirection: 'row', flexWrap: 'wrap' }, day: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginVertical: 2 }, daySelected: { borderRadius: 18, backgroundColor: colors.primary }, dayText: { ...typography.bodySmall, color: colors.text, fontWeight: '600' }, dayTextSelected: { color: colors.textInverse }, dayDisabled: { color: colors.textLight, opacity: .4 }, closeCalendar: { alignSelf: 'center', marginTop: spacing.md, padding: spacing.sm }, closeCalendarText: { ...typography.label, color: colors.primary }, backLink: { ...typography.bodySmall, color: colors.primary, fontWeight: '700' } });
