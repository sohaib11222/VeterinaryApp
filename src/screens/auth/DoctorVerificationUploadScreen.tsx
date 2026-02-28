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
      const result = await DocumentPicker.getDocumentAsync({
        type: ACCEPT[key].split(',').map((t) => t.trim()) as any,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setFiles((prev) => ({ ...prev, [key]: result.assets[0] }));
    } catch (e) {
      Toast.show({ type: 'error', text1: t('common.error'), text2: t('authVerification.common.couldNotPickFile') });
    }
  };

  const onSubmit = async () => {
    const missing = REQUIRED_DOCS.filter((k) => !files[k]);
    if (missing.length > 0) {
      Toast.show({
        type: 'error',
        text1: t('authVerification.common.requiredDocuments'),
        text2: t('authVerification.common.pleaseUpload', { items: missing.map((k) => t(LABELS[k])).join(', ') }),
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
        <Text style={styles.title}>{t('authDoctorVerificationUpload.title')}</Text>
        <Text style={styles.subtitle}>{t('authDoctorVerificationUpload.subtitle')}</Text>
      </View>

      <View style={styles.listBox}>
        <Text style={styles.listTitle}>{t('authDoctorVerificationUpload.requiredDocs.title')}</Text>
        <Text style={styles.listItem}>{t('authDoctorVerificationUpload.requiredDocs.items.registrationCertificate')}</Text>
        <Text style={styles.listItem}>{t('authDoctorVerificationUpload.requiredDocs.items.goodStandingCertificate')}</Text>
        <Text style={styles.listItem}>{t('authDoctorVerificationUpload.requiredDocs.items.cv')}</Text>
        <Text style={styles.listItem}>{t('authDoctorVerificationUpload.requiredDocs.items.specialistRegistration')}</Text>
        <Text style={styles.listItem}>{t('authDoctorVerificationUpload.requiredDocs.items.digitalSignature')}</Text>
      </View>

      {(REQUIRED_DOCS as DocKey[]).map((key) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{t(LABELS[key])} *</Text>
          <TouchableOpacity style={styles.pickBtn} onPress={() => pickDocument(key)}>
            <Text style={styles.pickBtnText} numberOfLines={1}>
              {files[key]?.name ?? t('authVerification.common.uploadDoc', { doc: t(LABELS[key]) })}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {(OPTIONAL_DOCS as DocKey[]).map((key) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{t(LABELS[key])}</Text>
          <TouchableOpacity style={styles.pickBtn} onPress={() => pickDocument(key)}>
            <Text style={styles.pickBtnText} numberOfLines={1}>
              {files[key]?.name ?? t('authVerification.common.uploadDoc', { doc: t(LABELS[key]) })}
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
