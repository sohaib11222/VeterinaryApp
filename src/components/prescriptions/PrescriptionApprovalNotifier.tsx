import React, { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { rootNavigationRef } from '../../navigation/navigationRef';
import { useMarkNotificationRead } from '../../mutations/notificationMutations';
import { useNotifications } from '../../queries/notificationQueries';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type PrescriptionApprovalNotification = {
  _id: string;
  title?: string;
  body?: string;
  isRead?: boolean;
  createdAt?: string;
  data?: { productId?: string | null; variantId?: string | null } | null;
};

function unwrapNotifications(payload: unknown): PrescriptionApprovalNotification[] {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  const data = (outer as { data?: unknown })?.data ?? outer;
  const notifications = (data as { notifications?: unknown[] })?.notifications;
  return Array.isArray(notifications)
    ? notifications
        .map((item) => item as PrescriptionApprovalNotification)
        .filter((item) => Boolean(item?._id) && !item.isRead)
    : [];
}

/**
 * Turns the existing one-time backend prescription-approval notification into
 * the same actionable in-app confirmation the web application provides.
 */
export function PrescriptionApprovalNotifier() {
  const { user } = useAuth();
  const isPetOwner = String(user?.role ?? '').toUpperCase() === 'PET_OWNER';
  const approvalsQuery = useNotifications(
    { type: 'PRESCRIPTION_APPROVED', unreadOnly: true, page: 1, limit: 20 },
    { enabled: isPetOwner, refetchInterval: 5_000 },
  );
  const markRead = useMarkNotificationRead();
  const [handledId, setHandledId] = useState<string | null>(null);

  const currentApproval = useMemo(() => {
    if (!isPetOwner) return null;
    return unwrapNotifications(approvalsQuery.data)
      .filter((item) => item._id !== handledId)
      .sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime())[0] ?? null;
  }, [approvalsQuery.data, handledId, isPetOwner]);

  const dismiss = useCallback(() => {
    if (!currentApproval) return;
    setHandledId(currentApproval._id);
    markRead.mutate(currentApproval._id);
  }, [currentApproval, markRead]);

  const openProduct = useCallback(() => {
    const productId = String(currentApproval?.data?.productId ?? '').trim();
    dismiss();
    if (!productId || !rootNavigationRef.isReady()) return;

    (rootNavigationRef as any).navigate('Main', {
      screen: 'PetOwnerTabs',
      params: {
        screen: 'PetOwnerPharmacy',
        params: {
          screen: 'ProductDetails',
          params: { productId },
        },
      },
    });
  }, [currentApproval?.data?.productId, dismiss]);

  const productAvailable = Boolean(String(currentApproval?.data?.productId ?? '').trim());
  return (
    <Modal visible={Boolean(currentApproval)} transparent animationType="fade" statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={dismiss}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={40} color={colors.success} />
          </View>
          <Text style={styles.title}>Prescription approved</Text>
          <Text style={styles.copy}>
            {currentApproval?.body || 'Your prescription has been approved. You can now purchase this medicine.'}
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={openProduct}
            disabled={!productAvailable}
          >
            <Ionicons name="bag-handle-outline" size={19} color={colors.textInverse} />
            <Text style={styles.primaryButtonText}>View medicine</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7} onPress={dismiss}>
            <Text style={styles.secondaryButtonText}>Later</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(8, 37, 30, 0.56)' },
  card: { width: '100%', maxWidth: 390, alignItems: 'center', borderRadius: 26, padding: spacing.xl, backgroundColor: colors.background },
  iconWrap: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successLight, marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.primaryDark, textAlign: 'center' },
  copy: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.lg },
  primaryButton: { width: '100%', minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, flexDirection: 'row', backgroundColor: colors.primary },
  primaryButtonText: { ...typography.label, color: colors.textInverse, fontWeight: '800' },
  secondaryButton: { marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  secondaryButtonText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '700' },
});
