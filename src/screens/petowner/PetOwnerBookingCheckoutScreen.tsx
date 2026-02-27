import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
import { useCreateAppointment } from '../../mutations/appointmentMutations';
import { useProcessAppointmentPayment } from '../../mutations/paymentMutations';
import Toast from 'react-native-toast-message';
import { getErrorMessage } from '../../utils/errorUtils';
import { useTranslation } from 'react-i18next';

type Route = RouteProp<PetOwnerStackParamList, 'PetOwnerBookingCheckout'>;

export function PetOwnerBookingCheckoutScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const params = route.params;
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CARD');

  const { data: vetProfileRes, isLoading: vetLoading } = useVeterinarianPublicProfile(params?.veterinarianId);
  const { data: petsRes } = usePets();
  const vetProfile = useMemo(() => (vetProfileRes as { data?: unknown })?.data ?? vetProfileRes, [vetProfileRes]) as Record<string, unknown> | null;
  const vetName = vetProfile?.userId
    ? (vetProfile.userId as { name?: string; fullName?: string }).fullName ?? (vetProfile.userId as { name?: string }).name ?? t('common.veterinarian')
    : t('common.veterinarian');

  const consultationFee = useMemo(() => {
    const fees = vetProfile?.consultationFees as { online?: number; clinic?: number } | undefined;
    const raw = params?.bookingType === 'ONLINE' ? fees?.online : fees?.clinic;
    const num = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(num) && num > 0 ? num : null;
  }, [vetProfile, params?.bookingType]);

  const pets = useMemo(() => {
    const raw = (petsRes as { data?: unknown })?.data ?? petsRes;
    return Array.isArray(raw) ? raw : (raw as { pets?: unknown[] })?.pets ?? [];
  }, [petsRes]) as { _id: string; name?: string; species?: string; breed?: string }[];
  const selectedPet = pets.find((p) => p._id === params?.petId);

  const createAppointment = useCreateAppointment();
  const processPayment = useProcessAppointmentPayment();
  const isProcessing = createAppointment.isPending || processPayment.isPending;

  const handleConfirm = async () => {
    if (!termsAccepted) { Toast.show({ type: 'error', text1: t('petOwnerBookingCheckout.validation.acceptTerms') }); return; }
    if (consultationFee == null) { Toast.show({ type: 'error', text1: t('petOwnerBookingCheckout.validation.consultationFeeNotSet') }); return; }
    if (!params?.veterinarianId || !params?.petId) { Toast.show({ type: 'error', text1: t('petOwnerBookingCheckout.validation.invalidBooking') }); return; }
    try {
      const appointmentRes = await createAppointment.mutateAsync({
        veterinarianId: params.veterinarianId,
        petOwnerId: (user as { id?: string })?.id ?? (user as { _id?: string })?._id,
        petId: params.petId,
        appointmentDate: params.appointmentDate,
        appointmentTime: params.appointmentTime,
        bookingType: params.bookingType,
        reason: params.reason,
        petSymptoms: params.petSymptoms,
        timezoneOffset: params.timezoneOffset,
      });
      const appointmentPayload = (appointmentRes as { data?: unknown })?.data ?? appointmentRes;
      const appointmentObj =
        (appointmentPayload as { data?: { _id?: string } })?.data ?? (appointmentPayload as { _id?: string });
      const appointmentId = (appointmentObj as { _id?: string })?._id;
      if (!appointmentId) throw new Error(t('petOwnerBookingCheckout.errors.createAppointmentFailed'));
      await processPayment.mutateAsync({ appointmentId, amount: consultationFee, paymentMethod });
      Toast.show({ type: 'success', text1: t('petOwnerBookingCheckout.toasts.booked') });
      navigation.navigate('PetOwnerBookingSuccess', { appointmentId });
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  if (!params?.veterinarianId || !params?.petId) {
    return (
      <ScreenContainer padded>
        <Card>
          <Text style={styles.errorText}>{t('petOwnerBookingCheckout.empty.noDetails')}</Text>
          <Button title={t('petOwnerBookingCheckout.actions.findVeterinarian')} onPress={() => navigation.navigate('PetOwnerSearch')} style={styles.mt} />
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.sectionTitle}>{t('petOwnerBookingCheckout.sections.summary')}</Text>
          <View style={styles.vetRow}>
            <View style={styles.avatarWrap}><Text style={styles.avatarLetter}>{vetName.charAt(0)}</Text></View>
            <Text style={styles.vetName}>{vetLoading ? t('petOwnerBookingCheckout.loading') : vetName}</Text>
          </View>
          <Text style={styles.summaryLine}>
            {t('petOwnerBookingCheckout.summary.date', { value: params.appointmentDate ? new Date(params.appointmentDate).toLocaleDateString() : t('common.na') })}
          </Text>
          <Text style={styles.summaryLine}>
            {t('petOwnerBookingCheckout.summary.time', { value: params.appointmentTime || t('common.na') })}
          </Text>
          <Text style={styles.summaryLine}>
            {t('petOwnerBookingCheckout.summary.type', { value: params.bookingType === 'ONLINE' ? t('petOwnerBookingCheckout.types.video') : t('petOwnerBookingCheckout.types.clinic') })}
          </Text>
          <Text style={styles.summaryLine}>
            {t('petOwnerBookingCheckout.summary.pet', {
              value: selectedPet
                ? `${selectedPet.name} (${selectedPet.species ?? selectedPet.breed ?? t('common.pet')})`
                : t('common.na'),
            })}
          </Text>
          <Text style={styles.summaryLine}>
            {t('petOwnerBookingCheckout.summary.reason', { value: params.reason || t('common.na') })}
          </Text>
          <Text style={styles.feeLine}>
            {t('petOwnerBookingCheckout.summary.consultation', { value: consultationFee != null ? `€${consultationFee.toFixed(2)}` : t('common.na') })}
          </Text>
          <Text style={styles.totalLine}>
            {t('petOwnerBookingCheckout.summary.total', { value: consultationFee != null ? `€${consultationFee.toFixed(2)}` : t('common.na') })}
          </Text>
        </Card>
        <Text style={styles.sectionTitle}>{t('petOwnerBookingCheckout.sections.payment')}</Text>
        <Card>
          <TouchableOpacity style={styles.radioRow} onPress={() => setPaymentMethod('CARD')}>
            <Text style={styles.radioIcon}>{paymentMethod === 'CARD' ? '◉' : '○'}</Text>
            <Text style={styles.radioLabel}>{t('petOwnerBookingCheckout.paymentMethods.card')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.radioRow} onPress={() => setPaymentMethod('DUMMY')}>
            <Text style={styles.radioIcon}>{paymentMethod === 'DUMMY' ? '◉' : '○'}</Text>
            <Text style={styles.radioLabel}>{t('petOwnerBookingCheckout.paymentMethods.demo')}</Text>
          </TouchableOpacity>
        </Card>
        <TouchableOpacity style={styles.termsRow} onPress={() => setTermsAccepted((a) => !a)}>
          <Text style={styles.radioIcon}>{termsAccepted ? '☑' : '☐'}</Text>
          <Text style={styles.termsLabel}>{t('petOwnerBookingCheckout.terms.accept')}</Text>
        </TouchableOpacity>
        <Button
          title={
            isProcessing
              ? t('petOwnerBookingCheckout.actions.processing')
              : (consultationFee != null
                  ? t('petOwnerBookingCheckout.actions.payAmount', { amount: consultationFee.toFixed(2) })
                  : t('petOwnerBookingCheckout.actions.confirm'))
          }
          onPress={handleConfirm}
          disabled={isProcessing || !termsAccepted || consultationFee == null}
          style={styles.confirmBtn}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  errorText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  mt: { marginTop: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  vetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatarWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  avatarLetter: { ...typography.h3, color: colors.primary },
  vetName: { ...typography.body, fontWeight: '600' },
  summaryLine: { ...typography.caption, marginBottom: 4, color: colors.textSecondary },
  feeLine: { ...typography.body, marginTop: spacing.sm },
  totalLine: { ...typography.h3, marginTop: spacing.xs },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  radioIcon: { marginRight: spacing.sm, fontSize: 18 },
  radioLabel: { ...typography.body },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  termsLabel: { ...typography.caption, flex: 1 },
  confirmBtn: { marginTop: spacing.md, marginBottom: spacing.xl },
});
