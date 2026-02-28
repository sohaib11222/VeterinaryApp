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
import { useTranslation } from 'react-i18next';

type Nav = AuthStackScreenProps<'PetStoreVerificationUpload'>['navigation'];

const DOCS = [
  { key: 'petStoreLicense', docType: 'PET_STORE_LICENSE', labelKey: 'authPetStoreVerificationUpload.docs.petStoreLicense', required: true },
  { key: 'pharmacistDegree', docType: 'PET_STORE_DEGREE', labelKey: 'authPetStoreVerificationUpload.docs.pharmacistDegree', required: true },
  { key: 'ownerId', docType: 'PET_STORE_OWNER_ID', labelKey: 'authPetStoreVerificationUpload.docs.ownerId', required: true },
  { key: 'addressProof', docType: 'PET_STORE_ADDRESS_PROOF', labelKey: 'authPetStoreVerificationUpload.docs.addressProof', required: true },
] as const;

const ACCEPT = 'application/pdf,image/*';

export function PetStoreVerificationUploadScreen() {
  const { t } = useTranslation();
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
      Toast.show({ type: 'error', text1: t('common.error'), text2: t('authVerification.common.couldNotPickFile') });
    }
  };

  const onSubmit = async () => {
    const missing = DOCS.filter((d) => d.required && !files[d.key]);
    if (missing.length > 0) {
      Toast.show({
        type: 'error',
        text1: t('authVerification.common.requiredDocuments'),
        text2: t('authVerification.common.pleaseUpload', { items: missing.map((d) => t(d.labelKey)).join(', ') }),
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
      Toast.show({ type: 'success', text1: t('authVerification.common.documentsUploaded'), text2: t('authVerification.common.documentsSubmittedSuccessfully') });
      navigation.replace('PendingApproval');
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: t('authVerification.common.uploadFailedTitle'), text2: getErrorMessage(err, t('authVerification.common.failedToUploadDocuments')) });
    } finally {
      if (tempUris.length > 0) await deleteCacheFiles(tempUris).catch(() => {});
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scroll padded style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('authPetStoreVerificationUpload.title')}</Text>
        <Text style={styles.subtitle}>{t('authPetStoreVerificationUpload.subtitle')}</Text>
      </View>

      <View style={styles.listBox}>
        <Text style={styles.listTitle}>{t('authPetStoreVerificationUpload.requiredDocs.title')}</Text>
        <Text style={styles.listItem}>{t('authPetStoreVerificationUpload.requiredDocs.items.petStoreLicense')}</Text>
        <Text style={styles.listItem}>{t('authPetStoreVerificationUpload.requiredDocs.items.pharmacistDegree')}</Text>
        <Text style={styles.listItem}>{t('authPetStoreVerificationUpload.requiredDocs.items.ownerId')}</Text>
        <Text style={styles.listItem}>{t('authPetStoreVerificationUpload.requiredDocs.items.addressProof')}</Text>
      </View>

      {DOCS.map((doc) => (
        <View key={doc.key} style={styles.field}>
          <Text style={styles.label}>
            {t(doc.labelKey)} {doc.required ? '*' : ''}
          </Text>
          <TouchableOpacity style={styles.pickBtn} onPress={() => pickDocument(doc.key)}>
            <Text style={styles.pickBtnText} numberOfLines={1}>
              {files[doc.key]?.name ?? t('authVerification.common.uploadDoc', { doc: t(doc.labelKey) })}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <Button
        title={loading ? t('authVerification.common.uploading') : t('authVerification.common.submitForVerification')}
        onPress={onSubmit}
        loading={loading}
        style={styles.submitBtn}
      />

      <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
        <Text style={styles.backLinkText}>{t('common.back')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.statusLink} onPress={() => navigation.navigate('PendingApproval')}>
        <Text style={styles.backLinkText}>{t('authVerification.common.alreadySubmittedViewStatus')}</Text>
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
