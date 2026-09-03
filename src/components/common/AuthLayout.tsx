import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type AuthIcon = keyof typeof MaterialCommunityIcons.glyphMap;

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  icon?: AuthIcon;
  eyebrow?: string;
  progress?: { current: number; total: number };
  footer?: ReactNode;
  cardStyle?: StyleProp<ViewStyle>;
  compact?: boolean;
}

/**
 * Shared visual shell for the complete authentication journey. It intentionally
 * contains no business logic, so login, registration and verification flows use
 * the same polished visual language without changing their existing behaviour.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  icon = 'heart-pulse',
  eyebrow = 'MYPETPLUS CARE',
  progress,
  footer,
  cardStyle,
  compact = false,
}: AuthLayoutProps) {
  const dots = Array.from({ length: progress?.total ?? 0 });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.authBackground} />
      <View pointerEvents="none" style={[styles.orb, styles.orbTop]} />
      <View pointerEvents="none" style={[styles.orb, styles.orbBottom]} />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, compact && styles.scrollContentCompact]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <MaterialCommunityIcons name="paw" size={18} color={colors.textInverse} />
              </View>
              <Text style={styles.brandName}>MyPetPlus</Text>
              <View style={styles.brandRule} />
              <Text style={styles.brandTag}>VETERINARY CARE</Text>
            </View>

            <View style={[styles.hero, compact && styles.heroCompact]}>
              <View style={styles.iconHalo}>
                <View style={styles.iconDisc}>
                  <MaterialCommunityIcons name={icon} size={29} color={colors.primaryDark} />
                </View>
              </View>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>

              {progress ? (
                <View
                  style={styles.progress}
                  accessibilityLabel={`Step ${progress.current} of ${progress.total}`}
                >
                  {dots.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.progressDot,
                        index < progress.current && styles.progressDotActive,
                      ]}
                    />
                  ))}
                </View>
              ) : null}
            </View>

            <View style={[styles.card, cardStyle]}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface AuthInfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  tone?: 'success' | 'neutral' | 'warning';
  last?: boolean;
}

export function AuthInfoRow({
  icon,
  title,
  description,
  tone = 'neutral',
  last = false,
}: AuthInfoRowProps) {
  const toneStyle = tone === 'success'
    ? styles.infoIconSuccess
    : tone === 'warning'
      ? styles.infoIconWarning
      : styles.infoIconNeutral;

  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={[styles.infoIcon, toneStyle]}>
        <Ionicons
          name={icon}
          size={18}
          color={tone === 'success' ? colors.success : tone === 'warning' ? colors.secondaryDark : colors.primary}
        />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoTitle}>{title}</Text>
        {description ? <Text style={styles.infoDescription}>{description}</Text> : null}
      </View>
    </View>
  );
}

interface AuthUploadFieldProps {
  label: string;
  selectedFileName?: string;
  required?: boolean;
  onPress: () => void;
}

export function AuthUploadField({
  label,
  selectedFileName,
  required = false,
  onPress,
}: AuthUploadFieldProps) {
  const { t } = useTranslation();
  const selected = Boolean(selectedFileName);

  return (
    <View style={styles.uploadWrapper}>
      <View style={styles.uploadLabelRow}>
        <Text style={styles.uploadLabel}>{label}</Text>
        {required ? <Text style={styles.requiredBadge}>{t('authExperience.documents.required')}</Text> : null}
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.75}
        onPress={onPress}
        style={[styles.uploadField, selected && styles.uploadFieldSelected]}
      >
        <View style={[styles.uploadIcon, selected && styles.uploadIconSelected]}>
          <Ionicons
            name={selected ? 'checkmark-circle' : 'cloud-upload-outline'}
            size={20}
            color={selected ? colors.success : colors.primary}
          />
        </View>
        <View style={styles.uploadCopy}>
          <Text numberOfLines={1} style={[styles.uploadFileName, selected && styles.uploadFileNameSelected]}>
            {selected ? selectedFileName : t('authExperience.documents.selectFile')}
          </Text>
          <Text style={styles.uploadHint}>{selected ? t('authExperience.documents.readyToSubmit') : t('authExperience.documents.supportedFiles')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.authBackground,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  scrollContentCompact: {
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  orb: {
    position: 'absolute',
    borderRadius: borderRadius.full,
  },
  orbTop: {
    width: 270,
    height: 270,
    right: -145,
    top: -105,
    backgroundColor: colors.primaryLight + '17',
  },
  orbBottom: {
    width: 230,
    height: 230,
    left: -135,
    bottom: -75,
    backgroundColor: colors.accent + '12',
  },
  brandRow: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -0.45,
  },
  brandRule: {
    width: 1,
    height: 14,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  brandTag: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  heroCompact: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  iconHalo: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.primaryLight + '1D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconDisc: {
    width: 62,
    height: 62,
    borderRadius: 23,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryLight + '32',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.45,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    fontSize: 29,
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 360,
  },
  progress: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  progressDot: {
    height: 5,
    width: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E4EEE8',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoIconSuccess: {
    backgroundColor: colors.successLight,
  },
  infoIconNeutral: {
    backgroundColor: colors.primaryLight + '18',
  },
  infoIconWarning: {
    backgroundColor: colors.warningLight,
  },
  infoCopy: {
    flex: 1,
  },
  infoTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: 2,
  },
  infoDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  uploadWrapper: {
    marginBottom: spacing.md,
  },
  uploadLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  uploadLabel: {
    ...typography.label,
    color: colors.primaryDark,
    flex: 1,
    marginRight: spacing.sm,
  },
  requiredBadge: {
    fontSize: 9,
    letterSpacing: 0.6,
    fontWeight: '800',
    color: colors.error,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  uploadField: {
    minHeight: 66,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primaryLight + '66',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight + '0D',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadFieldSelected: {
    borderStyle: 'solid',
    borderColor: colors.success + '88',
    backgroundColor: colors.successLight + '55',
  },
  uploadIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  uploadIconSelected: {
    backgroundColor: colors.background,
  },
  uploadCopy: {
    flex: 1,
    marginRight: spacing.sm,
  },
  uploadFileName: {
    ...typography.bodySmall,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  uploadFileNameSelected: {
    color: colors.success,
  },
  uploadHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
