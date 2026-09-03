import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import type { AuthStackScreenProps } from '../../navigation/types';
import { AuthInfoRow, AuthLayout, AuthUploadField } from '../../components/common/AuthLayout';
import { Button } from '../../components/common/Button';
import { uploadPetStoreDoc } from '../../services/upload';
import { copyToCacheUri, deleteCacheFiles, getExtensionFromMime } from '../../utils/fileUpload';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
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
        type: ACCEPT.split(',').map((type) => type.trim()) as any,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setFiles((previous) => ({ ...previous, [key]: result.assets[0] }));
    } catch {
      Toast.show({ type: 'error', text1: t('common.error'), text2: t('authVerification.common.couldNotPickFile') });
    }
  };

  const onSubmit = async () => {
    const missing = DOCS.filter((doc) => doc.required && !files[doc.key]);
    if (missing.length > 0) {
      Toast.show({
        type: 'error',
        text1: t('authVerification.common.requiredDocuments'),
        text2: t('authVerification.common.pleaseUpload', { items: missing.map((doc) => t(doc.labelKey)).join(', ') }),
      });
      return;
    }

    setLoading(true);
    const tempUris: string[] = [];
    try {
      for (let index = 0; index < DOCS.length; index += 1) {
        const doc = DOCS[index];
        const asset = files[doc.key];
        if (!asset?.uri) continue;
        const mime = asset.mimeType ?? 'application/octet-stream';
        const name = asset.name ?? `file-${doc.key}`;
        const uri = await copyToCacheUri(asset.uri, index, getExtensionFromMime(mime));
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
    <AuthLayout
      icon="file-document-edit-outline"
      title={t('authPetStoreVerificationUpload.title')}
      subtitle={t('authPetStoreVerificationUpload.subtitle')}
      progress={{ current: 2, total: 2 }}
    >
      <View style={styles.intro}>
        <View style={styles.introIcon}><Ionicons name="shield-checkmark-outline" size={19} color={colors.primary} /></View>
        <View style={styles.introCopy}>
          <Text style={styles.introTitle}>{t('authPetStoreVerificationUpload.requiredDocs.title')}</Text>
          <Text style={styles.introText}>{t('authExperience.documents.pharmacyIntro')}</Text>
        </View>
      </View>

      <View style={styles.requirements}>
        {DOCS.map((doc, index) => (
          <AuthInfoRow key={doc.key} icon="checkmark-circle-outline" tone="neutral" title={t(doc.labelKey)} last={index === DOCS.length - 1} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('authExperience.documents.uploadTitle')}</Text>
        <Text style={styles.sectionSubtitle}>{t('authExperience.documents.allRequired')}</Text>
      </View>

      {DOCS.map((doc) => (
        <AuthUploadField key={doc.key} label={t(doc.labelKey)} selectedFileName={files[doc.key]?.name} required={doc.required} onPress={() => pickDocument(doc.key)} />
      ))}

      <Button title={loading ? t('authVerification.common.uploading') : t('authVerification.common.submitForVerification')} onPress={onSubmit} loading={loading} style={styles.submitBtn} icon={<Ionicons name="cloud-upload-outline" size={20} color={colors.textInverse} />} />
      <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()} hitSlop={8}>
        <Ionicons name="arrow-back" size={16} color={colors.primary} />
        <Text style={styles.backLinkText}>{t('common.back')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.statusLink} onPress={() => navigation.navigate('PendingApproval')} hitSlop={8}>
        <Text style={styles.statusLinkText}>{t('authVerification.common.alreadySubmittedViewStatus')}</Text>
        <Ionicons name="arrow-forward" size={15} color={colors.primary} />
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  intro: { flexDirection: 'row', backgroundColor: colors.primaryLight + '12', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  introIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  introCopy: { flex: 1 },
  introTitle: { ...typography.label, color: colors.primaryDark, marginBottom: 3 },
  introText: { ...typography.caption, color: colors.textSecondary, lineHeight: 17 },
  requirements: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, marginBottom: spacing.xl },
  sectionHeader: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.primaryDark, marginBottom: 3 },
  sectionSubtitle: { ...typography.bodySmall, color: colors.textSecondary },
  submitBtn: { marginTop: spacing.sm, marginBottom: spacing.lg },
  backLink: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: spacing.md },
  backLinkText: { ...typography.bodySmall, color: colors.primary, fontWeight: '700' },
  statusLink: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusLinkText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
});
