import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useUnreadNotificationsCount } from '../../queries/notificationQueries';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

function extractUnreadCount(payload: unknown): number {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  const data = (outer as { data?: unknown })?.data ?? outer;
  const value = (data as { unreadCount?: unknown })?.unreadCount;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function NotificationBell({ color = colors.textInverse }: { color?: string }) {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const unreadQuery = useUnreadNotificationsCount({ enabled: !!user, refetchInterval: 30_000 });
  const unreadCount = useMemo(() => extractUnreadCount(unreadQuery.data), [unreadQuery.data]);

  const handlePress = () => {
    const role = (user?.role ?? '').toUpperCase();

    // Pharmacy / Parapharmacy: navigate to More tab stack screen
    if (role === 'PET_STORE' || role === 'PARAPHARMACY') {
      try {
        navigation.navigate('PharmacyMore', { screen: 'PharmacyNotifications' });
        return;
      } catch {
        // ignore
      }
      try {
        const tabNav = navigation.getParent?.();
        tabNav?.navigate('PharmacyMore', { screen: 'PharmacyNotifications' });
        return;
      } catch {
        // ignore
      }
      return;
    }

    if (role === 'VETERINARIAN') {
      try {
        const parent = navigation.getParent?.();
        parent?.navigate('VetNotifications');
        return;
      } catch {
        // ignore
      }
      try {
        navigation.navigate('VetNotifications');
      } catch {
        // ignore
      }
      return;
    }

    // Default to Pet Owner
    try {
      const parent = navigation.getParent?.();
      parent?.navigate('PetOwnerNotifications');
      return;
    } catch {
      // ignore
    }
    try {
      navigation.navigate('PetOwnerNotifications');
    } catch {
      // ignore
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <Text style={[styles.icon, { color }]}>🔔</Text>
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : String(unreadCount)}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', padding: 6 },
  icon: { fontSize: 20 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { ...typography.caption, color: colors.textInverse, fontSize: 10, fontWeight: '700' },
});
