import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVetHeaderSearch } from '../../contexts/VetHeaderSearchContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface VetHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  /** Optional avatar image URI for chat/details header */
  avatarUri?: string | null;
  /** If false, header has no rounded bottom corners (default true) */
  roundedBottom?: boolean;
}

export function VetHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  transparent = false,
  avatarUri,
  roundedBottom = true,
}: VetHeaderProps) {
  const insets = useSafeAreaInsets();
  const searchContext = useVetHeaderSearch();
  const searchConfig = searchContext?.config ?? null;
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0);

  return (
    <View style={[styles.wrapper, roundedBottom && styles.roundedBottom, { paddingTop: topInset }, transparent && styles.transparent]}>
      <View style={styles.gradient}>
        <View style={styles.gradientInner} />
        <View style={styles.gradientAccent} />
      </View>
      <View style={styles.content}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🐾</Text>
          </View>
        )}
        {avatarUri ? (
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          </View>
        ) : null}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>
        {rightAction ? (
          <View style={styles.right}>{rightAction}</View>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      {searchConfig ? (
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={searchConfig.placeholder}
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={searchConfig.value}
              onChangeText={searchConfig.onChangeText}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.primary,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  roundedBottom: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientInner: {
    flex: 1,
    backgroundColor: colors.primary,
    opacity: 0.98,
  },
  gradientAccent: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryLight,
    opacity: 0.2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backIcon: {
    fontSize: 28,
    color: colors.textInverse,
    fontWeight: '300',
    marginTop: -2,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  logoIcon: {
    fontSize: 20,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 2,
  },
  right: {
    marginLeft: spacing.xs,
  },
  placeholder: {
    width: 40,
  },
  searchWrap: {
    marginTop: spacing.sm,
    zIndex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    opacity: 0.9,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textInverse,
    paddingVertical: spacing.sm,
  },
});
