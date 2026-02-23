import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import type { AuthStackScreenProps } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Button } from '../../components/common/Button';
import { uploadPetStoreDoc } from '../../services/upload';
import { copyToCacheUri, deleteCacheFiles, getExtensionFromMime } from '../../utils/fileUpload';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Nav = AuthStackScreenProps<'PetStoreVerificationUpload'>['navigation'];

const DOCS = [
  { key: 'petStoreLicense', docType: 'PET_STORE_LICENSE', label: 'Pet Store License', required: true },
  { key: 'pharmacistDegree', docType: 'PET_STORE_DEGREE', label: 'Pharmacist Degree / Qualification', required: true },
  { key: 'ownerId', docType: 'PET_STORE_OWNER_ID', label: 'Owner Photo ID', required: true },
  { key: 'addressProof', docType: 'PET_STORE_ADDRESS_PROOF', label: 'Address Proof', required: true },
] as const;

const ACCEPT = 'application/pdf,image/*';

export function PetStoreVerificationUploadScreen() {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<Partial<Record<string, DocumentPicker.DocumentPickerAsset>>>({});

  const pickDocument = async (key: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ACCEPT.split(',').map((t) => t.trim()) as any,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setFiles((prev) => ({ ...prev, [key]: result.assets[0] }));
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not pick file' });
    }
  };

  const onSubmit = async () => {
    const missing = DOCS.filter((d) => d.required && !files[d.key]);
    if (missing.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Required documents',
        text2: `Please upload: ${missing.map((d) => d.label).join(', ')}`,
      });
      return;
    }

    setLoading(true);
    const tempUris: string[] = [];
    try {
      for (let i = 0; i < DOCS.length; i++) {
        const doc = DOCS[i];
        const asset = files[doc.key];
        if (!asset?.uri) continue;
        const mime = asset.mimeType ?? 'application/octet-stream';
        const name = asset.name ?? `file-${doc.key}`;
        const ext = getExtensionFromMime(mime);
        const uri = await copyToCacheUri(asset.uri, i, ext);
        tempUris.push(uri);
        await uploadPetStoreDoc({ uri, name, type: mime }, doc.docType);
      }
      Toast.show({ type: 'success', text1: 'Documents uploaded', text2: 'Verification documents submitted successfully!' });
      navigation.replace('PendingApproval');
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: getErrorMessage(err, 'Failed to upload documents.') });
    } finally {
      if (tempUris.length > 0) await deleteCacheFiles(tempUris).catch(() => {});
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scroll padded style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pharmacy / Parapharmacy Verification</Text>
        <Text style={styles.subtitle}>Upload the required documents. Your account will remain pending until admin approval.</Text>
      </View>

      <View style={styles.listBox}>
        <Text style={styles.listTitle}>Required documents</Text>
        <Text style={styles.listItem}>• Pet Store License</Text>
        <Text style={styles.listItem}>• Pharmacist Degree / Qualification</Text>
        <Text style={styles.listItem}>• Owner Photo ID</Text>
        <Text style={styles.listItem}>• Address Proof (utility bill / lease)</Text>
      </View>

      {DOCS.map((doc) => (
        <View key={doc.key} style={styles.field}>
          <Text style={styles.label}>
            {doc.label} {doc.required ? '*' : ''}
          </Text>
          <TouchableOpacity style={styles.pickBtn} onPress={() => pickDocument(doc.key)}>
            <Text style={styles.pickBtnText} numberOfLines={1}>
              {files[doc.key]?.name ?? `Upload ${doc.label}`}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <Button
        title={loading ? 'Uploading...' : 'Submit for Verification'}
        onPress={onSubmit}
        loading={loading}
        style={styles.submitBtn}
      />

      <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
        <Text style={styles.backLinkText}>← Back</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.statusLink} onPress={() => navigation.navigate('PendingApproval')}>
        <Text style={styles.backLinkText}>Already submitted? View status</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.backgroundSecondary },
  header: { marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.primary, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary },
  listBox: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  listTitle: { ...typography.body, fontWeight: '600', marginBottom: spacing.sm },
  listItem: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  field: { marginBottom: spacing.lg },
  label: { ...typography.body, fontWeight: '600', marginBottom: spacing.xs },
  pickBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    borderStyle: 'dashed',
  },
  pickBtnText: { ...typography.bodySmall, color: colors.textSecondary },
  submitBtn: { marginTop: spacing.sm, marginBottom: spacing.md },
  backLink: { alignSelf: 'center', marginBottom: spacing.sm },
  statusLink: { alignSelf: 'center' },
  backLinkText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
});
