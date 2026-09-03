import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Country = { code: string; dialCode: string; label: string; flag: string };

const COUNTRIES: Country[] = [
  { code: 'IT', dialCode: '+39', label: 'Italy', flag: '🇮🇹' },
  { code: 'DE', dialCode: '+49', label: 'Germany', flag: '🇩🇪' },
  { code: 'FR', dialCode: '+33', label: 'France', flag: '🇫🇷' },
  { code: 'ES', dialCode: '+34', label: 'Spain', flag: '🇪🇸' },
  { code: 'GB', dialCode: '+44', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', dialCode: '+1', label: 'United States', flag: '🇺🇸' },
  { code: 'CA', dialCode: '+1', label: 'Canada', flag: '🇨🇦' },
  { code: 'PK', dialCode: '+92', label: 'Pakistan', flag: '🇵🇰' },
  { code: 'IN', dialCode: '+91', label: 'India', flag: '🇮🇳' },
  { code: 'AE', dialCode: '+971', label: 'United Arab Emirates', flag: '🇦🇪' },
];

function splitPhone(value: string) {
  const input = String(value || '').trim();
  const matched = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length).find((country) => input.startsWith(country.dialCode));
  if (!matched) return { country: COUNTRIES[0], local: input.replace(/\D/g, '') };
  return { country: matched, local: input.slice(matched.dialCode.length).replace(/\D/g, '') };
}

interface CountryPhoneInputProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  helperText?: string;
  editable?: boolean;
}

/** Controlled E.164-style phone field. The parent always receives +countryCode + digits without formatting characters. */
export function CountryPhoneInput({ label = 'Phone number', value, onChangeText, error, helperText, editable = true }: CountryPhoneInputProps) {
  const initial = useMemo(() => splitPhone(value), []);
  const [country, setCountry] = useState<Country>(initial.country);
  const [localNumber, setLocalNumber] = useState(initial.local);
  const [modalOpen, setModalOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const parsed = splitPhone(value);
    const normalized = `${parsed.country.dialCode}${parsed.local}`;
    if (value && normalized === value && (parsed.country.code !== country.code || parsed.local !== localNumber)) {
      setCountry(parsed.country); setLocalNumber(parsed.local);
    }
  }, [value, country.code, localNumber]);

  const setCountryAndValue = (nextCountry: Country) => {
    setCountry(nextCountry);
    onChangeText(localNumber ? `${nextCountry.dialCode}${localNumber}` : '');
    setModalOpen(false);
  };

  const setNumber = (next: string) => {
    const cleaned = next.replace(/\D/g, '');
    setLocalNumber(cleaned);
    onChangeText(cleaned ? `${country.dialCode}${cleaned}` : '');
  };

  return <View style={styles.wrapper}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrap, focused && styles.focused, !!error && styles.errorWrap, !editable && styles.disabled]}>
      <Ionicons name="call-outline" size={20} color={colors.primary} style={styles.phoneIcon} />
      <TouchableOpacity style={styles.countryButton} disabled={!editable} onPress={() => setModalOpen(true)} accessibilityRole="button" accessibilityLabel="Select phone country">
        <Text style={styles.flag}>{country.flag}</Text><Text style={styles.dialCode}>{country.dialCode}</Text><Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
      </TouchableOpacity>
      <View style={styles.verticalDivider} />
      <TextInput value={localNumber} onChangeText={setNumber} keyboardType="phone-pad" placeholder="Phone number" placeholderTextColor={colors.textLight} style={styles.input} editable={editable} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} maxLength={18} />
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
      <Pressable style={styles.overlay} onPress={() => setModalOpen(false)}>
        <Pressable style={styles.modal} onPress={(event) => event.stopPropagation()}>
          <View style={styles.modalHeader}><View><Text style={styles.modalTitle}>Select country</Text><Text style={styles.modalSubtitle}>Your number is saved in international format.</Text></View><TouchableOpacity onPress={() => setModalOpen(false)}><Ionicons name="close" size={23} color={colors.textSecondary} /></TouchableOpacity></View>
          <ScrollView showsVerticalScrollIndicator={false}>{COUNTRIES.map((item) => <TouchableOpacity key={`${item.code}-${item.dialCode}`} style={[styles.countryRow, item.code === country.code && styles.countryRowSelected]} onPress={() => setCountryAndValue(item)}><Text style={styles.countryFlag}>{item.flag}</Text><Text style={styles.countryName}>{item.label}</Text><Text style={styles.countryDial}>{item.dialCode}</Text>{item.code === country.code ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}</TouchableOpacity>)}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md }, label: { ...typography.label, color: colors.primaryDark, marginBottom: 6 }, inputWrap: { minHeight: 56, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBFDFC', borderWidth: 1, borderColor: '#D9E5DE', borderRadius: borderRadius.md, paddingHorizontal: spacing.md }, focused: { borderColor: colors.primary, borderWidth: 1.5, backgroundColor: colors.background }, errorWrap: { borderColor: colors.error }, disabled: { opacity: .7, backgroundColor: colors.backgroundTertiary }, phoneIcon: { marginRight: spacing.sm }, countryButton: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 8 }, flag: { fontSize: 17 }, dialCode: { ...typography.bodySmall, color: colors.primaryDark, fontWeight: '700' }, verticalDivider: { height: 25, width: 1, backgroundColor: colors.border, marginHorizontal: spacing.sm }, input: { flex: 1, ...typography.body, paddingVertical: 11 }, helperText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, marginLeft: spacing.xs }, errorText: { ...typography.caption, color: colors.error, marginTop: spacing.xs, marginLeft: spacing.xs }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,31,23,0.38)' }, modal: { maxHeight: '70%', backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: spacing.lg }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight }, modalTitle: { ...typography.h3, color: colors.primaryDark }, modalSubtitle: { ...typography.caption, marginTop: 3 }, countryRow: { minHeight: 58, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, countryRowSelected: { backgroundColor: colors.primaryLight + '12' }, countryFlag: { fontSize: 22 }, countryName: { ...typography.body, flex: 1 }, countryDial: { ...typography.bodySmall, color: colors.textSecondary, marginRight: spacing.sm },
});
