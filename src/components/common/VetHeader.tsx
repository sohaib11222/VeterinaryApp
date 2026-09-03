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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVetHeaderSearch } from '../../contexts/VetHeaderSearchContext';
import { NotificationBell } from './NotificationBell';
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
            <Ionicons name="chevron-back" size={23} color={colors.textInverse} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoBadge}>
            <Ionicons name="paw" size={19} color={colors.textInverse} />
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
        <View style={styles.rightRow}>
          <NotificationBell />
          {rightAction ? <View style={styles.right}>{rightAction}</View> : null}
        </View>
      </View>
      {searchConfig ? (
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.78)" style={styles.searchIcon} />
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
    backgroundColor: colors.primaryDark,
    paddingBottom: spacing.md + 2,
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
    backgroundColor: colors.primaryDark,
    opacity: 0.98,
  },
  gradientAccent: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primaryLight,
    opacity: 0.28,
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
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
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
    fontSize: 19,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 2,
  },
  right: {
    marginLeft: spacing.xs,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchWrap: {
    marginTop: spacing.sm,
    zIndex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: spacing.sm,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textInverse,
    paddingVertical: spacing.sm,
  },
});
