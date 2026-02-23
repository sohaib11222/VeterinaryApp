import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { PetOwnerStackParamList } from '../../navigation/types';
import { useVeterinarianPublicProfile } from '../../queries/veterinarianQueries';
import { usePets } from '../../queries/petsQueries';
import { useWeeklyScheduleSlots } from '../../queries/scheduleQueries';
import Toast from 'react-native-toast-message';

type Route = RouteProp<PetOwnerStackParamList, 'PetOwnerBooking'>;

const BOOKING_TYPES = [
  { value: 'VISIT' as const, label: 'Clinic Visit' },
  { value: 'ONLINE' as const, label: 'Online Consultation' },
];

export function PetOwnerBookingScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const vetId = route.params?.vetId ?? '';

  const [bookingType, setBookingType] = useState<'VISIT' | 'ONLINE'>('VISIT');
  const [petId, setPetId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');
  const [petSymptoms, setPetSymptoms] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const petOwnerId = (user as { _id?: string })?._id ?? (user as { id?: string })?.id ?? '';

  const { data: petsRes } = usePets();
  const pets = useMemo(() => {
    const raw = (petsRes as { data?: unknown })?.data ?? petsRes;
    return Array.isArray(raw) ? raw : (raw as { pets?: unknown[] })?.pets ?? [];
  }, [petsRes]) as { _id: string; name?: string }[];

  const { data: vetProfileRes, isLoading: vetLoading } = useVeterinarianPublicProfile(vetId);
  const vetName = useMemo(() => {
    const p = (vetProfileRes as { data?: { userId?: { name?: string; fullName?: string } } })?.data;
    return p?.userId?.fullName ?? p?.userId?.name ?? 'Veterinarian';
  }, [vetProfileRes]);

  const { data: slotsRes, isLoading: slotsLoading } = useWeeklyScheduleSlots(
    vetId || null,
    appointmentDate || null,
    !!appointmentDate
  );
  const availableSlots = useMemo(() => {
    const raw = (slotsRes as { data?: unknown })?.data ?? slotsRes;
    return Array.isArray(raw) ? raw : [];
  }, [slotsRes]) as { startTime?: string; endTime?: string }[];

  useEffect(() => {
    if (!appointmentDate) setAppointmentTime('');
  }, [appointmentDate]);

  const minDate = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  const dateOptions = useMemo(() => {
    const today = new Date();
    const options: { date: string; label: string; weekday: string }[] = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const weekday = weekdays[d.getDay()];
      options.push({ date: dateStr, label, weekday });
    }
    return options;
  }, []);

  const handleProceed = () => {
    if (!vetId) {
      Toast.show({ type: 'error', text1: 'Please select a veterinarian first' });
      return;
    }
    if (!petOwnerId || !user) {
      Toast.show({ type: 'error', text1: 'Please log in to book' });
      return;
    }
    if (!petId) {
      Toast.show({ type: 'error', text1: 'Please select a pet' });
      return;
    }
    if (!appointmentDate) {
      Toast.show({ type: 'error', text1: 'Please select a date' });
      return;
    }
    if (!appointmentTime) {
      Toast.show({ type: 'error', text1: 'Please select a time slot' });
      return;
    }
    if (!reason.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a reason' });
      return;
    }
    const tzOffset = -new Date().getTimezoneOffset();
    navigation.navigate('PetOwnerBookingCheckout', {
      veterinarianId: vetId,
      petId,
      appointmentDate,
      appointmentTime,
      bookingType,
      reason: reason.trim(),
      ...(petSymptoms.trim() && { petSymptoms: petSymptoms.trim() }),
      timezoneOffset: tzOffset,
    });
  };

  if (!vetId) {
    return (
      <ScreenContainer padded>
        <Card>
          <Text style={styles.errorText}>Please select a veterinarian from search to book.</Text>
          <Button title="Find Veterinarians" onPress={() => navigation.navigate('PetOwnerSearch')} style={styles.mt} />
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.vetName}>{vetLoading ? 'Loading...' : vetName}</Text>
          <Text style={styles.subtitle}>Book a veterinary appointment</Text>
        </Card>

        <Text style={styles.label}>Appointment Type</Text>
        <View style={styles.typeRow}>
          {BOOKING_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeChip, bookingType === t.value && styles.typeChipActive]}
              onPress={() => setBookingType(t.value)}
            >
              <Text style={[styles.typeChipText, bookingType === t.value && styles.typeChipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Pet</Text>
        <View style={styles.pickerWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pets.map((p) => (
              <TouchableOpacity
                key={p._id}
                style={[styles.petChip, petId === p._id && styles.petChipActive]}
                onPress={() => setPetId(p._id)}
              >
                <Text style={[styles.petChipText, petId === p._id && styles.petChipTextActive]}>{p.name ?? 'Pet'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {pets.length === 0 && (
          <Text style={styles.hint}>You have no pets. Add a pet first from My Pets.</Text>
        )}

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.dateButtonText, !appointmentDate && styles.dateButtonPlaceholder]}>
            {appointmentDate
              ? dateOptions.find((o) => o.date === appointmentDate)?.label ?? appointmentDate
              : 'Select date'}
          </Text>
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>
        <Modal visible={showDatePicker} transparent animationType="slide">
          <Pressable style={styles.dateModalOverlay} onPress={() => setShowDatePicker(false)}>
            <View style={styles.dateModalContent}>
              <View style={styles.dateModalHeader}>
                <Text style={styles.dateModalTitle}>Select date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.dateModalClose}>Done</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={dateOptions}
                keyExtractor={(item) => item.date}
                style={styles.dateList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.dateRow, appointmentDate === item.date && styles.dateRowActive]}
                    onPress={() => {
                      setAppointmentDate(item.date);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={styles.dateRowWeekday}>{item.weekday}</Text>
                    <Text style={[styles.dateRowLabel, appointmentDate === item.date && styles.dateRowLabelActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </Pressable>
        </Modal>

        <Text style={styles.label}>Time Slot</Text>
        <View style={styles.slotWrap}>
          {!appointmentDate && (
            <Text style={styles.hint}>Select a date first</Text>
          )}
          {appointmentDate && slotsLoading && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
          {appointmentDate && !slotsLoading && availableSlots.length === 0 && (
            <Text style={styles.hint}>No slots available for this date</Text>
          )}
          {appointmentDate && !slotsLoading && availableSlots.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotScroll}>
              {availableSlots.map((s, idx) => {
                const start = s.startTime ?? '';
                const end = s.endTime ?? '';
                const value = start;
                const isSelected = appointmentTime === value;
                return (
                  <TouchableOpacity
                    key={`${start}-${idx}`}
                    style={[styles.slotChip, isSelected && styles.slotChipActive]}
                    onPress={() => setAppointmentTime(value)}
                  >
                    <Text style={[styles.slotChipText, isSelected && styles.slotChipTextActive]}>{start} - {end}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <Text style={styles.label}>Reason</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Vaccination, fever, checkup"
          placeholderTextColor={colors.textLight}
          value={reason}
          onChangeText={setReason}
        />

        <Text style={styles.label}>Pet Symptoms (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe symptoms..."
          placeholderTextColor={colors.textLight}
          value={petSymptoms}
          onChangeText={setPetSymptoms}
          multiline
          numberOfLines={3}
        />

        <Button
          title="Proceed to Checkout"
          onPress={handleProceed}
          disabled={pets.length === 0}
          style={styles.submitBtn}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  errorText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  mt: { marginTop: spacing.md },
  vetName: { ...typography.h3, marginBottom: 2 },
  subtitle: { ...typography.small, color: colors.textSecondary },
  label: { ...typography.small, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.xs },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { ...typography.body },
  typeChipTextActive: { color: colors.textInverse },
  pickerWrap: { marginBottom: spacing.xs },
  petChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.backgroundTertiary,
    marginRight: spacing.sm,
  },
  petChipActive: { backgroundColor: colors.primary },
  petChipText: { ...typography.body },
  petChipTextActive: { color: colors.textInverse },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: { ...typography.body },
  dateButtonPlaceholder: { color: colors.textLight },
  calendarIcon: { fontSize: 18 },
  dateModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  dateModalContent: { backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%' },
  dateModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  dateModalTitle: { ...typography.h3 },
  dateModalClose: { ...typography.body, color: colors.primary, fontWeight: '600' },
  dateList: { maxHeight: 320 },
  dateRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dateRowActive: { backgroundColor: colors.primaryLight },
  dateRowWeekday: { ...typography.caption, width: 40, color: colors.textSecondary },
  dateRowLabel: { ...typography.body, flex: 1 },
  dateRowLabelActive: { fontWeight: '600', color: colors.primary },
  inputText: { ...typography.body },
  textArea: { minHeight: 72 },
  hint: { ...typography.small, color: colors.textLight, marginTop: spacing.xs },
  slotWrap: { minHeight: 44, marginBottom: spacing.sm },
  slotScroll: { marginTop: spacing.xs },
  slotChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  slotChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotChipText: { ...typography.small },
  slotChipTextActive: { color: colors.textInverse },
  submitBtn: { marginTop: spacing.xl, marginBottom: spacing.xl },
});
