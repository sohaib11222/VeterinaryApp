import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import type { AuthStackScreenProps } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Button } from '../../components/common/Button';
import { uploadVeterinarianDocs } from '../../services/upload';
import { copyToCacheUri, deleteCacheFiles, getExtensionFromMime } from '../../utils/fileUpload';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Nav = AuthStackScreenProps<'DoctorVerificationUpload'>['navigation'];

type DocKey = 'registrationCertificate' | 'goodStandingCertificate' | 'cv' | 'specialistRegistration' | 'digitalSignature';

const REQUIRED_DOCS: DocKey[] = ['registrationCertificate', 'goodStandingCertificate', 'cv'];
const OPTIONAL_DOCS: DocKey[] = ['specialistRegistration', 'digitalSignature'];

const LABELS: Record<DocKey, string> = {
  registrationCertificate: 'Certificate of Registration',
  goodStandingCertificate: 'Certificate of Good Standing',
  cv: 'Curriculum Vitae (CV)',
  specialistRegistration: 'Specialist Registration (Optional)',
  digitalSignature: 'Digital Signature (Optional)',
};

const ACCEPT: Record<DocKey, string> = {
  registrationCertificate: 'application/pdf,image/*',
  goodStandingCertificate: 'application/pdf,image/*',
  cv: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  specialistRegistration: 'application/pdf,image/*',
  digitalSignature: 'application/pdf,image/*',
};

export function DoctorVerificationUploadScreen() {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<Partial<Record<DocKey, DocumentPicker.DocumentPickerAsset>>>({});

  const pickDocument = async (key: DocKey) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ACCEPT[key].split(',').map((t) => t.trim()) as any,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setFiles((prev) => ({ ...prev, [key]: result.assets[0] }));
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not pick file' });
    }
  };

  const onSubmit = async () => {
    const missing = REQUIRED_DOCS.filter((k) => !files[k]);
    if (missing.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Required documents',
        text2: `Please upload: ${missing.map((k) => LABELS[k]).join(', ')}`,
      });
      return;
    }

    setLoading(true);
    const tempUris: string[] = [];
    try {
      const toUpload: { uri: string; name: string; type: string }[] = [];
      let index = 0;
      for (const key of [...REQUIRED_DOCS, ...OPTIONAL_DOCS]) {
        const asset = files[key];
        if (!asset?.uri) continue;
        const mime = asset.mimeType ?? 'application/octet-stream';
        const name = asset.name ?? `file-${key}`;
        const ext = getExtensionFromMime(mime);
        const uri = await copyToCacheUri(asset.uri, index, ext);
        tempUris.push(uri);
        index += 1;
        toUpload.push({ uri, name, type: mime });
      }

      await uploadVeterinarianDocs(toUpload);
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
        <Text style={styles.title}>Doctor Verification</Text>
        <Text style={styles.subtitle}>Upload your verification documents. All fields marked with * are required.</Text>
      </View>

      <View style={styles.listBox}>
        <Text style={styles.listTitle}>Required documents</Text>
        <Text style={styles.listItem}>• Certificate of Registration with the Medical Council</Text>
        <Text style={styles.listItem}>• Certificate of Good Standing (valid 3 months)</Text>
        <Text style={styles.listItem}>• Curriculum Vitae</Text>
        <Text style={styles.listItem}>• Specialist Registration (if applicable)</Text>
        <Text style={styles.listItem}>• Digital signature (if applicable)</Text>
      </View>

      {(REQUIRED_DOCS as DocKey[]).map((key) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{LABELS[key]} *</Text>
          <TouchableOpacity style={styles.pickBtn} onPress={() => pickDocument(key)}>
            <Text style={styles.pickBtnText} numberOfLines={1}>
              {files[key]?.name ?? `Upload ${LABELS[key]}`}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {(OPTIONAL_DOCS as DocKey[]).map((key) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{LABELS[key]}</Text>
          <TouchableOpacity style={styles.pickBtn} onPress={() => pickDocument(key)}>
            <Text style={styles.pickBtnText} numberOfLines={1}>
              {files[key]?.name ?? `Upload ${LABELS[key]}`}
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
