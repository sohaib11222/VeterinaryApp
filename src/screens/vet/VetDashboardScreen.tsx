import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { useVetHeaderSearch } from '../../contexts/VetHeaderSearchContext';
import { useVetHeaderRightAction } from '../../contexts/VetHeaderRightActionContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function VetDashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const stackNav = navigation.getParent();
  const headerSearch = useVetHeaderSearch();
  const headerRight = useVetHeaderRightAction();

  // Dashboard: no header search, no right icons
  useFocusEffect(
    React.useCallback(() => {
      headerSearch?.setConfig(null);
      headerRight?.setRightAction(null);
      return () => {};
    }, [])
  );

  // Mock stats – UI only
  const stats = [
    { label: "Today's Appointments", value: '5', icon: '📅', color: colors.primary },
    { label: 'Pending Requests', value: '2', icon: '🐾', color: colors.secondaryDark },
    { label: 'Total Pets Seen', value: '24', icon: '🐕', color: colors.accent },
  ];

  const todayAppointments = [
    { id: '1', time: '09:00', pet: 'Max (Dog)', owner: 'John D.' },
    { id: '2', time: '10:30', pet: 'Whiskers (Cat)', owner: 'Jane M.' },
    { id: '3', time: '14:00', pet: 'Buddy (Dog)', owner: 'Alex K.' },
  ];

  const quickLinks = [
    { label: 'Pet Requests', icon: '📋', screen: 'VetPetRequests' as const },
    { label: 'Clinic Hours', icon: '🕐', screen: 'VetClinicHours' as const },
    { label: 'My Pets', icon: '🐾', screen: 'VetMyPets' as const },
    { label: 'Vaccinations', icon: '💉', screen: 'VetVaccinations' as const },
    { label: 'Reviews', icon: '⭐', screen: 'VetReviews' as const },
    { label: 'Invoices', icon: '📄', screen: 'VetInvoices' as const },
  ];

  return (
    <ScreenContainer scroll padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Welcome */}
        <View style={styles.welcome}>
          <Text style={styles.welcomeLabel}>Welcome back</Text>
          <Text style={styles.welcomeName}>{user?.name || 'Veterinarian'}</Text>
        </View>

        {/* Stats row – modern cards */}
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: s.color + '12' }]}>
              <View style={[styles.statIconWrap, { backgroundColor: s.color + '25' }]}>
                <Text style={styles.statIcon}>{s.icon}</Text>
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel} numberOfLines={2}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Today's appointments */}
        <Card style={styles.todayCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Appointments</Text>
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('VetAppointments')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {todayAppointments.map((apt, idx) => (
            <TouchableOpacity
              key={apt.id}
              style={[styles.appointmentRow, idx === todayAppointments.length - 1 && styles.appointmentRowLast]}
              activeOpacity={0.7}
              onPress={() => stackNav?.navigate('VetAppointmentDetails', { appointmentId: apt.id })}
            >
              <View style={styles.timeBadge}>
                <Text style={styles.timeText}>{apt.time}</Text>
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.petName}>{apt.pet}</Text>
                <Text style={styles.ownerName}>{apt.owner}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Quick access */}
        <Text style={styles.quickSectionTitle}>Quick access</Text>
        <View style={styles.quickGrid}>
          {quickLinks.map((link, i) => (
            <TouchableOpacity key={i} style={styles.quickItem} activeOpacity={0.7} onPress={() => stackNav?.navigate(link.screen)}>
              <View style={styles.quickIconWrap}>
                <Text style={styles.quickIcon}>{link.icon}</Text>
              </View>
              <Text style={styles.quickLabel} numberOfLines={1}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xxl },
  welcome: { marginBottom: spacing.lg },
  welcomeLabel: { ...typography.bodySmall, color: colors.textSecondary },
  welcomeName: { ...typography.h1, color: colors.text },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statIcon: { fontSize: 20 },
  statValue: { ...typography.h2, fontWeight: '700' },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  todayCard: { marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3, marginBottom: 0 },
  seeAll: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  appointmentRowLast: { borderBottomWidth: 0 },
  timeBadge: {
    backgroundColor: colors.primaryLight + '25',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 10,
    marginRight: spacing.md,
    minWidth: 52,
    alignItems: 'center',
  },
  timeText: { ...typography.label, color: colors.primary, fontWeight: '600' },
  appointmentInfo: { flex: 1 },
  petName: { ...typography.body, fontWeight: '600' },
  ownerName: { ...typography.caption, color: colors.textSecondary },
  chevron: { ...typography.h3, color: colors.textLight },
  quickSectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickItem: {
    width: '31%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 92,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickIcon: { fontSize: 24 },
  quickLabel: { ...typography.caption, color: colors.text, textAlign: 'center', fontWeight: '500' },
  bottomSpacer: { height: spacing.xl },
});
