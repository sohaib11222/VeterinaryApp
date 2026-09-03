import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { API_BASE_URL, getImageUrl } from '../../config/api';
import { usePharmacyPrescriptionRequests, type PharmacyPrescriptionRequest } from '../../queries/productPrescriptionRequestQueries';
import { useReviewProductPrescriptionRequest } from '../../mutations/productPrescriptionRequestMutations';
import { getErrorMessage } from '../../utils/errorUtils';

type Filter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

function unwrapRequests(payload: unknown): PharmacyPrescriptionRequest[] {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  const inner = (outer as { data?: unknown })?.data ?? outer;
  const list = (inner as { requests?: PharmacyPrescriptionRequest[] })?.requests;
  return Array.isArray(list) ? list : [];
}

function requestVariantLabel(request: PharmacyPrescriptionRequest): string {
  const variant = request?.productId?.selectedVariant as Record<string, unknown> | undefined;
  if (!variant) return 'Standard product option';
  return String(variant.name || [variant.strengthValue ? `${variant.strengthValue} ${variant.strengthUnit ?? ''}`.trim() : '', variant.dosageForm, variant.unitsPerPack ? `${variant.unitsPerPack} ${variant.unitLabel ?? 'units'}` : ''].filter(Boolean).join(' · ') || 'Selected option');
}

function documentUrl(value?: string): string | null {
  if (!value) return null;
  return getImageUrl(value) ?? `${API_BASE_URL.replace(/\/api\/?$/, '')}${value.startsWith('/') ? '' : '/'}${value}`;
}

function statusStyle(status: string) {
  if (status === 'APPROVED') return { bg: colors.successLight, fg: colors.success };
  if (status === 'REJECTED') return { bg: colors.errorLight, fg: colors.error };
  return { bg: colors.warningLight, fg: '#805B00' };
}

export function PharmacyPrescriptionRequestsScreen() {
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [reviewing, setReviewing] = useState<PharmacyPrescriptionRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const requestsQuery = usePharmacyPrescriptionRequests({ status: filter, page: 1, limit: 50 }, { refetchInterval: 12_000 });
  const reviewMutation = useReviewProductPrescriptionRequest();
  const requests = useMemo(() => unwrapRequests(requestsQuery.data), [requestsQuery.data]);

  const openDocument = (request: PharmacyPrescriptionRequest) => {
    const url = documentUrl(request.prescriptionUrl);
    if (!url) {
      Toast.show({ type: 'error', text1: 'Prescription file is unavailable' });
      return;
    }
    Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: 'Could not open the prescription file' }));
  };

  const startReview = (request: PharmacyPrescriptionRequest) => {
    setReviewing(request);
    setReviewNotes('');
  };

  const submitReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewing?._id) return;
    try {
      await reviewMutation.mutateAsync({ requestId: reviewing._id, status, reviewNotes: reviewNotes.trim() || undefined });
      Toast.show({ type: 'success', text1: status === 'APPROVED' ? 'Prescription approved' : 'Prescription rejected', text2: status === 'APPROVED' ? 'The customer can now purchase this medicine.' : 'The customer has been notified.' });
      setReviewing(null);
      setReviewNotes('');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Could not review prescription', text2: getErrorMessage(error, 'Try again shortly.') });
    }
  };

  return (
    <ScreenContainer padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.heroCard}>
          <View style={styles.heroIcon}><Ionicons name="document-text-outline" size={25} color={colors.textInverse} /></View>
          <Text style={styles.heroTitle}>Prescription requests</Text>
          <Text style={styles.heroText}>Review each customer document before unlocking a prescription medicine.</Text>
        </Card>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as Filter[]).map((item) => <TouchableOpacity key={item} style={[styles.filter, filter === item && styles.filterActive]} onPress={() => setFilter(item)}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item === 'ALL' ? 'All' : item[0] + item.slice(1).toLowerCase()}</Text></TouchableOpacity>)}
        </ScrollView>

        {requestsQuery.isLoading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View> : requestsQuery.isError ? <View style={styles.center}><Ionicons name="cloud-offline-outline" size={34} color={colors.error} /><Text style={styles.errorText}>Could not load prescription requests.</Text><Button title="Try again" variant="outline" onPress={() => requestsQuery.refetch()} /></View> : requests.length === 0 ? <View style={styles.center}><View style={styles.emptyIcon}><Ionicons name="file-tray-outline" size={30} color={colors.primary} /></View><Text style={styles.emptyTitle}>No {filter === 'ALL' ? '' : filter.toLowerCase()} requests</Text><Text style={styles.emptyText}>New customer prescription submissions will appear here automatically.</Text></View> : requests.map((request) => {
          const owner = request.petOwnerId ?? {};
          const product = request.productId ?? {};
          const status = String(request.status || 'PENDING').toUpperCase();
          const theme = statusStyle(status);
          return <Card key={request._id} style={styles.requestCard}>
            <View style={styles.requestHeader}><View style={styles.requestHeading}><Text style={styles.productName}>{product.name || 'Product unavailable'}</Text><Text style={styles.variantText}>{requestVariantLabel(request)}</Text></View><View style={[styles.statusPill, { backgroundColor: theme.bg }]}><Text style={[styles.statusText, { color: theme.fg }]}>{status}</Text></View></View>
            <View style={styles.customerRow}><View style={styles.customerIcon}><Ionicons name="person-outline" size={16} color={colors.primaryDark} /></View><View style={styles.customerCopy}><Text style={styles.customerName}>{owner.fullName || owner.name || 'Customer'}</Text><Text style={styles.customerMeta}>{[owner.email, owner.phone].filter(Boolean).join(' · ') || 'Customer details unavailable'}</Text></View></View>
            <Text style={styles.submittedText}>Submitted {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'recently'}</Text>
            {request.reviewNotes ? <View style={styles.noteBox}><Text style={styles.noteLabel}>Review note</Text><Text style={styles.noteText}>{request.reviewNotes}</Text></View> : null}
            <View style={styles.actionRow}><Button title="Open document" variant="outline" onPress={() => openDocument(request)} style={styles.actionButton} />{status === 'PENDING' ? <Button title="Review" onPress={() => startReview(request)} style={styles.actionButton} /> : null}</View>
          </Card>;
        })}
      </ScrollView>

      <Modal visible={!!reviewing} transparent animationType="fade" onRequestClose={() => setReviewing(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setReviewing(null)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}><View><Text style={styles.modalTitle}>Review prescription</Text><Text style={styles.modalSubtitle} numberOfLines={1}>{reviewing?.productId?.name || 'Medicine'}</Text></View><TouchableOpacity onPress={() => setReviewing(null)}><Ionicons name="close" size={23} color={colors.textSecondary} /></TouchableOpacity></View>
            <Text style={styles.modalBodyText}>Approve only if this prescription is valid for the requested product. A note is shared with the customer if you reject it.</Text>
            <TextInput style={styles.noteInput} value={reviewNotes} onChangeText={setReviewNotes} placeholder="Optional review note" placeholderTextColor={colors.textLight} multiline textAlignVertical="top" />
            <View style={styles.modalActions}><Button title="Reject" variant="outline" onPress={() => submitReview('REJECTED')} disabled={reviewMutation.isPending} style={styles.modalButton} /><Button title="Approve" onPress={() => submitReview('APPROVED')} loading={reviewMutation.isPending} style={styles.modalButton} /></View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xxl }, heroCard: { backgroundColor: colors.primaryDark, overflow: 'hidden', marginBottom: spacing.md }, heroIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.primaryLight, marginBottom: spacing.sm }, heroTitle: { ...typography.h2, color: colors.textInverse }, heroText: { ...typography.bodySmall, color: 'rgba(255,255,255,0.77)', marginTop: 5, lineHeight: 20 }, filters: { gap: 8, paddingRight: spacing.md, marginBottom: spacing.md }, filter: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 }, filterActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '1C' }, filterText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '700' }, filterTextActive: { color: colors.primaryDark }, center: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm }, errorText: { ...typography.body, color: colors.error, textAlign: 'center' }, emptyIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '1C' }, emptyTitle: { ...typography.h3, marginTop: spacing.sm }, emptyText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', maxWidth: 285 }, requestCard: { marginBottom: spacing.sm }, requestHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }, requestHeading: { flex: 1, minWidth: 0 }, productName: { ...typography.label, color: colors.text }, variantText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 3 }, statusPill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 }, statusText: { ...typography.caption, fontWeight: '800' }, customerRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md }, customerIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '1B', marginRight: spacing.sm }, customerCopy: { flex: 1, minWidth: 0 }, customerName: { ...typography.bodySmall, fontWeight: '800' }, customerMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 }, submittedText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm }, noteBox: { marginTop: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.primaryLight, backgroundColor: colors.backgroundSecondary, padding: spacing.sm, borderRadius: 8 }, noteLabel: { ...typography.caption, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase' }, noteText: { ...typography.bodySmall, marginTop: 3 }, actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }, actionButton: { flex: 1 }, modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16, 34, 27, 0.54)', padding: spacing.md }, modalCard: { width: '100%', maxWidth: 430, borderRadius: 20, backgroundColor: colors.background, overflow: 'hidden', padding: spacing.md }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }, modalTitle: { ...typography.h3 }, modalSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 }, modalBodyText: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20, marginTop: spacing.md }, noteInput: { minHeight: 96, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.sm, ...typography.bodySmall, marginTop: spacing.md, backgroundColor: colors.backgroundSecondary }, modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }, modalButton: { flex: 1 },
});
