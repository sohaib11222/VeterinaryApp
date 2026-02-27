import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { usePets } from '../../queries/petsQueries';
import {
  useMedicalRecords,
  useVaccinations,
  useUpcomingVaccinations,
  type MedicalRecordItem,
} from '../../queries/medicalQueries';
import { useMyPrescriptions } from '../../queries/prescriptionQueries';
import { useCreateMedicalRecordWithUpload, useDeleteMedicalRecord } from '../../mutations/medicalMutations';
import { useTranslation } from 'react-i18next';

type TabType = 'medical' | 'vaccinations' | 'prescription';

const RECORD_TYPES = ['GENERAL', 'LAB_REPORT', 'XRAY', 'VACCINATION', 'SURGERY', 'WEIGHT', 'PRESCRIPTION', 'OTHER'];

function formatDate(d: string | undefined, naLabel: string): string {
  if (!d) return naLabel;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return naLabel;
  return dt.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

type PetItem = { _id: string; name?: string };

export function PetOwnerMedicalRecordsScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('medical');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [page, setPage] = useState(1);
  const [vaccinationPage, setVaccinationPage] = useState(1);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm, setAddForm] = useState({ petId: '', title: '', description: '', recordType: 'GENERAL' });
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; mimeType?: string } | null>(null);
  const [viewRecord, setViewRecord] = useState<MedicalRecordItem | null>(null);

  const { data: petsResponse } = usePets();
  const pets = useMemo(() => {
    const outer = (petsResponse as { data?: unknown })?.data ?? petsResponse;
    const payload = (outer as { data?: unknown })?.data ?? outer;
    const raw = Array.isArray(payload) ? payload : [];
    return raw
      .map((p) => p as Partial<PetItem>)
      .filter((p) => !!p && typeof p._id === 'string' && p._id.length > 0)
      .map((p) => ({ _id: String(p._id), name: p.name }));
  }, [petsResponse]);

  const recordTypeFilter = activeTab === 'prescription' ? 'PRESCRIPTION' : undefined;
  const medicalParams = useMemo(
    () => ({ page, limit: 20, ...(selectedPetId ? { petId: selectedPetId } : {}), ...(recordTypeFilter ? { recordType: recordTypeFilter } : {}) }),
    [page, selectedPetId, recordTypeFilter]
  );
  const { data: recordsResponse, isLoading: recordsLoading } = useMedicalRecords(activeTab === 'medical' ? medicalParams : { page: 1, limit: 1 });
  const recordsPayload = (recordsResponse as { data?: { records?: MedicalRecordItem[]; pagination?: { pages?: number } } })?.data ?? {};
  const records = recordsPayload.records ?? [];

  const vaccinationParams = useMemo(
    () => ({ page: vaccinationPage, limit: 20, ...(selectedPetId ? { petId: selectedPetId } : {}) }),
    [vaccinationPage, selectedPetId]
  );
  const { data: vaccinationsResponse, isLoading: vaccinationsLoading } = useVaccinations(activeTab === 'vaccinations' ? vaccinationParams : { page: 1, limit: 1 });
  const vaccinationsPayload = (vaccinationsResponse as { data?: { vaccinations?: unknown[] } })?.data ?? {};
  const vaccinations = vaccinationsPayload.vaccinations ?? [];

  const { data: upcomingResponse } = useUpcomingVaccinations(selectedPetId ? { petId: selectedPetId } : {});
  const upcomingPayload = (upcomingResponse as { data?: { vaccinations?: unknown[] } })?.data ?? {};
  const upcomingVaccinations = upcomingPayload.vaccinations ?? [];

  const prescriptionsParams = useMemo(
    () => ({ page: 1, limit: 100, ...(selectedPetId ? { petId: selectedPetId } : {}) }),
    [selectedPetId]
  );
  const { data: prescriptionsRes, isLoading: prescriptionsLoading } = useMyPrescriptions(prescriptionsParams, { enabled: activeTab === 'prescription' });
  const prescriptionsPayload = (prescriptionsRes as { data?: { prescriptions?: unknown[] } })?.data ?? (prescriptionsRes as { prescriptions?: unknown[] });
  const prescriptions = prescriptionsPayload?.prescriptions ?? [];

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      const title = (r.title ?? '').toLowerCase();
      const desc = (r.description ?? '').toLowerCase();
      const petName = (r.petId as { name?: string })?.name ?? '';
      const type = (r.recordType ?? '').toLowerCase();
      return title.includes(q) || desc.includes(q) || petName.toLowerCase().includes(q) || type.includes(q);
    });
  }, [records, searchQuery]);

  const filteredVaccinations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return vaccinations;
    return (vaccinations as { vaccinationType?: string; petId?: { name?: string } }[]).filter((v) => {
      const type = (v.vaccinationType ?? '').toLowerCase();
      const petName = (v.petId?.name ?? '').toLowerCase();
      return type.includes(q) || petName.includes(q);
    });
  }, [vaccinations, searchQuery]);

  const filteredPrescriptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return prescriptions;
    return (prescriptions as { diagnosis?: string; petId?: { name?: string }; veterinarianId?: { name?: string } }[]).filter((p) => {
      const petName = (p.petId?.name ?? '').toLowerCase();
      const vetName = (p.veterinarianId?.name ?? '').toLowerCase();
      const dx = (p.diagnosis ?? '').toLowerCase();
      return petName.includes(q) || vetName.includes(q) || dx.includes(q);
    });
  }, [prescriptions, searchQuery]);

  const createRecord = useCreateMedicalRecordWithUpload();
  const deleteRecord = useDeleteMedicalRecord();

  const tabs: { key: TabType; label: string }[] = [
    { key: 'medical', label: t('petOwnerMedicalRecords.tabs.medical') },
    { key: 'vaccinations', label: t('petOwnerMedicalRecords.tabs.vaccinations') },
    { key: 'prescription', label: t('petOwnerMedicalRecords.tabs.prescriptions') },
  ];

  const handleAddRecord = async () => {
    if (!addForm.petId) {
      Alert.alert(t('common.validation'), t('petOwnerMedicalRecords.validation.selectPet'));
      return;
    }
    if (!addForm.title.trim()) {
      Alert.alert(t('common.validation'), t('petOwnerMedicalRecords.validation.titleRequired'));
      return;
    }
    if (!selectedFile) {
      Alert.alert(t('common.validation'), t('petOwnerMedicalRecords.validation.selectFile'));
      return;
    }
    try {
      await createRecord.mutateAsync({
        petId: addForm.petId,
        title: addForm.title.trim(),
        description: addForm.description.trim() || null,
        recordType: addForm.recordType,
        file: selectedFile,
      });
      setAddModalVisible(false);
      setAddForm({ petId: selectedPetId || '', title: '', description: '', recordType: 'GENERAL' });
      setSelectedFile(null);
      Alert.alert(t('common.success'), t('petOwnerMedicalRecords.alerts.added'));
    } catch (err: unknown) {
      Alert.alert(t('common.error'), (err as { message?: string })?.message ?? t('petOwnerMedicalRecords.errors.addFailed'));
    }
  };

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
    if (result.canceled) return;
    setSelectedFile(result.assets[0]);
  };

  const handleDeleteRecord = (record: MedicalRecordItem) => {
    Alert.alert(t('petOwnerMedicalRecords.deleteConfirm.title'), t('petOwnerMedicalRecords.deleteConfirm.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecord.mutateAsync(record._id);
            setViewRecord(null);
            Alert.alert(t('common.success'), t('petOwnerMedicalRecords.alerts.deleted'));
          } catch (err: unknown) {
            Alert.alert(t('common.error'), (err as { message?: string })?.message ?? t('petOwnerMedicalRecords.errors.deleteFailed'));
          }
        },
      },
    ]);
  };

  const isLoading = activeTab === 'medical' ? recordsLoading : activeTab === 'vaccinations' ? vaccinationsLoading : prescriptionsLoading;
  const listData = activeTab === 'medical' ? filteredRecords : activeTab === 'vaccinations' ? filteredVaccinations : filteredPrescriptions;

  const renderMedicalItem = ({ item }: { item: MedicalRecordItem }) => (
    <Card style={styles.card}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordId}>#{String(item._id).slice(-6).toUpperCase()}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {t(`petOwnerMedicalRecords.recordTypes.${item.recordType || 'GENERAL'}`, {
              defaultValue: item.recordType || 'GENERAL',
            })}
          </Text>
        </View>
      </View>
      <Text style={styles.recordTitle}>{item.title}</Text>
      {item.description ? <Text style={styles.recordDesc}>{item.description}</Text> : null}
      <View style={styles.recordRow}>
        <Text style={styles.recordLabel}>{t('petOwnerMedicalRecords.labels.pet')}</Text>
        <Text style={styles.recordValue}>{(item.petId as { name?: string })?.name ?? t('common.na')}</Text>
      </View>
      <View style={styles.recordRow}>
        <Text style={styles.recordLabel}>{t('petOwnerMedicalRecords.labels.date')}</Text>
        <Text style={styles.recordValue}>{formatDate(item.uploadedDate, t('common.na'))}</Text>
      </View>
      {item.fileName ? (
        <View style={styles.recordRow}>
          <Text style={styles.recordLabel}>{t('petOwnerMedicalRecords.labels.file')}</Text>
          <Text style={styles.fileLink}>{item.fileName}</Text>
        </View>
      ) : null}
      <View style={styles.rowActions}>
        <TouchableOpacity style={styles.viewBtn} onPress={() => setViewRecord(item)}>
          <Text style={styles.viewBtnText}>{t('common.view')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteRecord(item)}
          disabled={deleteRecord.isPending}
        >
          <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderVaccinationItem = ({ item }: { item: Record<string, unknown> }) => (
    <Card style={styles.card}>
      <Text style={styles.recordTitle}>💉 {String(item.vaccinationType ?? t('common.na'))}</Text>
      <View style={styles.recordRow}>
        <Text style={styles.recordLabel}>{t('petOwnerMedicalRecords.labels.pet')}</Text>
        <Text style={styles.recordValue}>{(item.petId as { name?: string })?.name ?? t('common.na')}</Text>
      </View>
      <View style={styles.recordRow}>
        <Text style={styles.recordLabel}>{t('petOwnerMedicalRecords.labels.date')}</Text>
        <Text style={styles.recordValue}>{formatDate(item.vaccinationDate as string, t('common.na'))}</Text>
      </View>
      <View style={styles.recordRow}>
        <Text style={styles.recordLabel}>{t('petOwnerMedicalRecords.labels.nextDue')}</Text>
        <Text style={styles.recordValue}>{formatDate(item.nextDueDate as string, t('common.na'))}</Text>
      </View>
      <View style={styles.recordRow}>
        <Text style={styles.recordLabel}>{t('petOwnerMedicalRecords.labels.veterinarian')}</Text>
        <Text style={styles.recordValue}>{(item.veterinarianId as { name?: string })?.name ?? t('common.na')}</Text>
      </View>
    </Card>
  );

  const renderPrescriptionItem = ({ item }: { item: Record<string, unknown> }) => {
    const aptId = (item as { appointmentId?: string | { _id?: string } }).appointmentId;
    const id = typeof aptId === 'object' ? aptId?._id : aptId;
    return (
      <Card style={styles.card}>
        <Text style={styles.recordTitle}>
          {t('petOwnerMedicalRecords.prescriptions.title', { id: String(item._id).slice(-6).toUpperCase() })}
        </Text>
        <View style={styles.recordRow}>
          <Text style={styles.recordLabel}>{t('petOwnerMedicalRecords.labels.pet')}</Text>
          <Text style={styles.recordValue}>{(item.petId as { name?: string })?.name ?? t('common.na')}</Text>
        </View>
        <View style={styles.recordRow}>
          <Text style={styles.recordLabel}>{t('petOwnerMedicalRecords.labels.veterinarian')}</Text>
          <Text style={styles.recordValue}>
            {(item.veterinarianId as { name?: string; fullName?: string })?.fullName ??
              (item.veterinarianId as { name?: string })?.name ??
              t('common.na')}
          </Text>
        </View>
        <View style={styles.recordRow}>
          <Text style={styles.recordLabel}>{t('petOwnerMedicalRecords.labels.date')}</Text>
          <Text style={styles.recordValue}>
            {formatDate(
              (item as { issuedAt?: string; createdAt?: string }).issuedAt ??
                (item as { createdAt?: string }).createdAt,
              t('common.na')
            )}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => {
            if (!id) return;
            navigation.navigate('PetOwnerPrescription', { appointmentId: String(id) });
          }}
        >
          <Text style={styles.viewBtnText}>{t('petOwnerMedicalRecords.prescriptions.view')}</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderItem =
    activeTab === 'medical'
      ? (renderMedicalItem as any)
      : activeTab === 'vaccinations'
        ? (renderVaccinationItem as any)
        : (renderPrescriptionItem as any);

  return (
    <ScreenContainer padded>
      <View style={styles.tabs}>
        {tabs.map((t) => (
          <TouchableOpacity key={t.key} style={[styles.tab, activeTab === t.key && styles.tabActive]} onPress={() => setActiveTab(t.key)}>
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]} numberOfLines={1}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('petOwnerMedicalRecords.searchPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>{t('petOwnerMedicalRecords.labels.pet')}</Text>
        <View style={styles.petChips}>
          <TouchableOpacity
            style={[styles.petChip, !selectedPetId && styles.petChipActive]}
            onPress={() => setSelectedPetId('')}
          >
            <Text style={[styles.petChipText, !selectedPetId && styles.petChipTextActive]}>{t('common.all')}</Text>
          </TouchableOpacity>
          {pets.map((p) => (
            <TouchableOpacity key={p._id} style={[styles.petChip, selectedPetId === p._id && styles.petChipActive]} onPress={() => setSelectedPetId(p._id)}><Text style={[styles.petChipText, selectedPetId === p._id && styles.petChipTextActive]}>{p.name}</Text></TouchableOpacity>
          ))}
        </View>
      </View>
      {activeTab === 'vaccinations' && upcomingVaccinations.length > 0 && (
        <Card style={styles.upcomingCard}>
          <Text style={styles.upcomingTitle}>{t('petOwnerMedicalRecords.upcoming.title')}</Text>
          {(upcomingVaccinations as Record<string, unknown>[]).slice(0, 5).map((v, idx) => (
            <View key={idx} style={styles.upcomingRow}>
              <Text style={styles.upcomingPet}>{(v.petId as { name?: string })?.name ?? t('common.na')}</Text>
              <Text style={styles.upcomingType}>{String(v.vaccinationType ?? t('common.na'))}</Text>
              <Text style={styles.upcomingDate}>{formatDate(v.nextDueDate as string, t('common.na'))}</Text>
            </View>
          ))}
        </Card>
      )}
      {activeTab === 'medical' && (
        <Button title={t('petOwnerMedicalRecords.actions.addRecord')} onPress={() => setAddModalVisible(true)} style={styles.addBtn} />
      )}
      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList<any>
          data={listData}
          keyExtractor={(item: unknown) => (item as { _id?: string })._id ?? String(Math.random())}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          ListEmptyComponent={(
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('petOwnerMedicalRecords.empty')}</Text>
            </View>
          )}
        />
      )}

      <Modal visible={addModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setAddModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <ScrollView>
              <Text style={styles.modalTitle}>{t('petOwnerMedicalRecords.addModal.title')}</Text>
              <Text style={styles.inputLabel}>{t('petOwnerMedicalRecords.addModal.fields.pet')}</Text>
              <View style={styles.pickerRow}>
                {pets.map((p) => (
                  <TouchableOpacity key={p._id} style={[styles.pickerOpt, addForm.petId === p._id && styles.pickerOptActive]} onPress={() => setAddForm((f) => ({ ...f, petId: p._id }))}><Text style={[styles.pickerOptText, addForm.petId === p._id && styles.pickerOptTextActive]}>{p.name}</Text></TouchableOpacity>
                ))}
              </View>
              <Input
                label={t('petOwnerMedicalRecords.addModal.fields.title')}
                placeholder={t('petOwnerMedicalRecords.addModal.placeholders.title')}
                value={addForm.title}
                onChangeText={(title) => setAddForm((f) => ({ ...f, title }))}
              />
              <Input
                label={t('petOwnerMedicalRecords.addModal.fields.description')}
                placeholder={t('petOwnerMedicalRecords.addModal.placeholders.description')}
                value={addForm.description}
                onChangeText={(description) => setAddForm((f) => ({ ...f, description }))}
              />
              <Text style={styles.inputLabel}>{t('petOwnerMedicalRecords.addModal.fields.recordType')}</Text>
              <View style={styles.pickerRow}>
                {RECORD_TYPES.slice(0, 4).map((tItem) => (
                  <TouchableOpacity
                    key={tItem}
                    style={[styles.pickerOpt, addForm.recordType === tItem && styles.pickerOptActive]}
                    onPress={() => setAddForm((f) => ({ ...f, recordType: tItem }))}
                  >
                    <Text style={[styles.pickerOptText, addForm.recordType === tItem && styles.pickerOptTextActive]}>
                      {t(`petOwnerMedicalRecords.recordTypes.${tItem}`, { defaultValue: tItem })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.fileBtn} onPress={handlePickFile}>
                <Text style={styles.fileBtnText}>
                  {selectedFile ? selectedFile.name : t('petOwnerMedicalRecords.addModal.placeholders.selectFile')}
                </Text>
              </TouchableOpacity>
              <View style={styles.modalActions}>
                <Button title={t('common.cancel')} onPress={() => setAddModalVisible(false)} style={styles.modalBtn} />
                <Button title={t('common.save')} onPress={handleAddRecord} disabled={createRecord.isPending} style={styles.modalBtn} />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {viewRecord && (
        <Modal visible transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setViewRecord(null)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>{viewRecord.title}</Text>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>{t('petOwnerMedicalRecords.labels.type')}</Text>
                <Text style={styles.recordValue}>
                  {t(`petOwnerMedicalRecords.recordTypes.${viewRecord.recordType ?? 'GENERAL'}`, {
                    defaultValue: viewRecord.recordType ?? 'GENERAL',
                  })}
                </Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>{t('petOwnerMedicalRecords.labels.pet')}</Text>
                <Text style={styles.recordValue}>{(viewRecord.petId as { name?: string })?.name ?? t('common.na')}</Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>{t('petOwnerMedicalRecords.labels.date')}</Text>
                <Text style={styles.recordValue}>{formatDate(viewRecord.uploadedDate, t('common.na'))}</Text>
              </View>
              {viewRecord.description ? <Text style={styles.recordDesc}>{viewRecord.description}</Text> : null}
              <View style={styles.modalActions}>
                <Button title={t('common.close')} onPress={() => setViewRecord(null)} style={styles.modalBtn} />
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteRecord(viewRecord)}>
                  <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', marginBottom: spacing.sm, backgroundColor: colors.backgroundTertiary, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: colors.background, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  tabText: { ...typography.caption, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundTertiary, borderRadius: 12, paddingHorizontal: spacing.sm, marginBottom: spacing.sm, minHeight: 44 },
  searchIcon: { marginRight: spacing.sm, fontSize: 16 },
  searchInput: { flex: 1, ...typography.body, paddingVertical: spacing.sm },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  filterLabel: { ...typography.label, marginRight: spacing.sm },
  petChips: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  petChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20, backgroundColor: colors.backgroundTertiary },
  petChipActive: { backgroundColor: colors.primary },
  petChipText: { ...typography.caption, color: colors.textSecondary },
  petChipTextActive: { color: colors.textInverse },
  upcomingCard: { marginBottom: spacing.sm },
  upcomingTitle: { ...typography.body, fontWeight: '600', marginBottom: spacing.xs },
  upcomingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  upcomingPet: { ...typography.bodySmall },
  upcomingType: { ...typography.bodySmall },
  upcomingDate: { ...typography.caption },
  addBtn: { marginBottom: spacing.sm },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center' },
  list: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  recordId: { ...typography.caption, color: colors.textSecondary },
  typeBadge: { backgroundColor: colors.primaryLight + '25', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  recordTitle: { ...typography.body, fontWeight: '600' },
  recordDesc: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  recordRow: { flexDirection: 'row', marginTop: 4 },
  recordLabel: { ...typography.caption, color: colors.textSecondary, width: 100 },
  recordValue: { ...typography.bodySmall, flex: 1 },
  fileLink: { ...typography.bodySmall, color: colors.primary },
  rowActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  viewBtn: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: colors.primary, borderRadius: 20 },
  viewBtnText: { ...typography.bodySmall, color: colors.textInverse, fontWeight: '600' },
  deleteBtn: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: colors.errorLight, borderRadius: 20 },
  deleteBtnText: { ...typography.bodySmall, color: colors.error, fontWeight: '600' },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.background, borderRadius: 16, padding: spacing.lg, width: '100%', maxWidth: 360, maxHeight: '85%' },
  modalTitle: { ...typography.h3, marginBottom: spacing.md },
  inputLabel: { ...typography.label, marginBottom: 4 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  pickerOpt: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.backgroundSecondary },
  pickerOptActive: { backgroundColor: colors.primary },
  pickerOptText: { ...typography.bodySmall },
  pickerOptTextActive: { color: colors.textInverse },
  fileBtn: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: colors.backgroundTertiary, borderRadius: 8, marginBottom: spacing.md },
  fileBtnText: { ...typography.body, color: colors.primary },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalBtn: { flex: 1 },
});
