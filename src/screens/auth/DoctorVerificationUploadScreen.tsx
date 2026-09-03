import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import type { AuthStackScreenProps } from '../../navigation/types';
import { AuthInfoRow, AuthLayout, AuthUploadField } from '../../components/common/AuthLayout';
import { Button } from '../../components/common/Button';
import { uploadVeterinarianDocs } from '../../services/upload';
import { copyToCacheUri, deleteCacheFiles, getExtensionFromMime } from '../../utils/fileUpload';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';

type Nav = AuthStackScreenProps<'DoctorVerificationUpload'>['navigation'];
type DocKey = 'registrationCertificate' | 'goodStandingCertificate' | 'cv' | 'specialistRegistration' | 'digitalSignature';

const REQUIRED_DOCS: DocKey[] = ['registrationCertificate', 'goodStandingCertificate', 'cv'];
const OPTIONAL_DOCS: DocKey[] = ['specialistRegistration', 'digitalSignature'];

const LABELS: Record<DocKey, string> = {
  registrationCertificate: 'authDoctorVerificationUpload.docs.registrationCertificate',
  goodStandingCertificate: 'authDoctorVerificationUpload.docs.goodStandingCertificate',
  cv: 'authDoctorVerificationUpload.docs.cv',
  specialistRegistration: 'authDoctorVerificationUpload.docs.specialistRegistration',
  digitalSignature: 'authDoctorVerificationUpload.docs.digitalSignature',
};

const ACCEPT: Record<DocKey, string> = {
  registrationCertificate: 'application/pdf,image/*',
  goodStandingCertificate: 'application/pdf,image/*',
  cv: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  specialistRegistration: 'application/pdf,image/*',
  digitalSignature: 'application/pdf,image/*',
};

export function DoctorVerificationUploadScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<Partial<Record<DocKey, DocumentPicker.DocumentPickerAsset>>>({});

  const pickDocument = async (key: DocKey) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ACCEPT[key].split(',').map((type) => type.trim()) as any, copyToCacheDirectory: true });
      if (result.canceled) return;
      setFiles((previous) => ({ ...previous, [key]: result.assets[0] }));
    } catch {
      Toast.show({ type: 'error', text1: t('common.error'), text2: t('authVerification.common.couldNotPickFile') });
    }
  };

  const onSubmit = async () => {
    const missing = REQUIRED_DOCS.filter((key) => !files[key]);
    if (missing.length > 0) {
      Toast.show({ type: 'error', text1: t('authVerification.common.requiredDocuments'), text2: t('authVerification.common.pleaseUpload', { items: missing.map((key) => t(LABELS[key])).join(', ') }) });
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
        const uri = await copyToCacheUri(asset.uri, index, getExtensionFromMime(mime));
        tempUris.push(uri);
        index += 1;
        toUpload.push({ uri, name, type: mime });
      }
      await uploadVeterinarianDocs(toUpload);
      Toast.show({ type: 'success', text1: t('authVerification.common.documentsUploaded'), text2: t('authVerification.common.documentsSubmittedSuccessfully') });
      navigation.replace('PendingApproval');
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: t('authVerification.common.uploadFailedTitle'), text2: getErrorMessage(err, t('authVerification.common.failedToUploadDocuments')) });
    } finally {
      if (tempUris.length > 0) await deleteCacheFiles(tempUris).catch(() => {});
      setLoading(false);
    }
  };

  const allDocs: DocKey[] = [...REQUIRED_DOCS, ...OPTIONAL_DOCS];

  return (
    <AuthLayout icon="clipboard-text-outline" title={t('authDoctorVerificationUpload.title')} subtitle={t('authDoctorVerificationUpload.subtitle')} progress={{ current: 1, total: 1 }}>
      <View style={styles.intro}>
        <View style={styles.introIcon}><Ionicons name="medical-outline" size={20} color={colors.primary} /></View>
        <View style={styles.introCopy}>
          <Text style={styles.introTitle}>{t('authDoctorVerificationUpload.requiredDocs.title')}</Text>
          <Text style={styles.introText}>{t('authExperience.documents.professionalIntro')}</Text>
        </View>
      </View>

      <View style={styles.requirements}>
        {allDocs.map((key, index) => (
          <AuthInfoRow key={key} icon={REQUIRED_DOCS.includes(key) ? 'checkmark-circle-outline' : 'add-circle-outline'} tone={REQUIRED_DOCS.includes(key) ? 'neutral' : 'warning'} title={t(LABELS[key])} description={REQUIRED_DOCS.includes(key) ? t('authExperience.documents.requiredForVerification') : t('authExperience.documents.optionalSupporting')} last={index === allDocs.length - 1} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('authExperience.documents.doctorUploadTitle')}</Text>
        <Text style={styles.sectionSubtitle}>{t('authExperience.documents.requiredMarked')}</Text>
      </View>
      {allDocs.map((key) => (
        <AuthUploadField key={key} label={t(LABELS[key])} selectedFileName={files[key]?.name} required={REQUIRED_DOCS.includes(key)} onPress={() => pickDocument(key)} />
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
