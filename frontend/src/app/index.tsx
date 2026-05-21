import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Spacing, Colors, Fonts } from '@/constants/theme';
import { apiService, Group } from '@/services/api';

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme() || 'dark';
  const colors = Colors[scheme === 'unspecified' ? 'dark' : scheme];

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setError(null);
      const data = await apiService.getGroups();
      setGroups(data);
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to FastAPI Backend. Make sure your server is running!');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.four,
      paddingBottom: Spacing.three,
      backgroundColor: colors.backgroundElement,
      borderBottomWidth: 3,
      borderBottomColor: colors.accent,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    appName: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    appSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      fontFamily: Fonts.mono,
      letterSpacing: 0.5,
    },
    heroCard: {
      margin: Spacing.four,
      padding: Spacing.four,
      borderRadius: 4, // Sharp brutalist
      backgroundColor: '#1E1E2E',
      borderWidth: 2,
      borderColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: 1, // Solid flat shadow
      shadowRadius: 0,
      elevation: 6,
    },
    heroText: {
      color: '#A5B4FC',
      fontSize: 13,
      fontWeight: 'bold',
      fontFamily: Fonts.mono,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    heroStat: {
      color: '#ffffff',
      fontSize: 48,
      fontWeight: '900',
      fontFamily: Fonts.mono,
      marginTop: Spacing.one,
    },
    heroDesc: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: Spacing.two,
      fontFamily: Fonts.mono,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.text,
      marginHorizontal: Spacing.four,
      marginBottom: Spacing.three,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    listContainer: {
      paddingHorizontal: Spacing.four,
      paddingBottom: Spacing.six * 2,
    },
    groupCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.four,
      borderRadius: 4, // Sharp brutalist
      backgroundColor: colors.backgroundElement,
      marginBottom: Spacing.three,
      borderWidth: 2,
      borderColor: colors.border,
      shadowColor: colors.accent,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.8,
      shadowRadius: 0,
      elevation: 4,
    },
    groupInfo: {
      flex: 1,
    },
    groupName: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: 0.5,
    },
    groupDate: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: Spacing.one,
      fontFamily: Fonts.mono,
    },
    chevron: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.accent,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorContainer: {
      margin: Spacing.four,
      padding: Spacing.four,
      borderRadius: 4,
      backgroundColor: '#FEF2F2',
      borderWidth: 2,
      borderColor: colors.error,
      alignItems: 'center',
      shadowColor: colors.error,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
    },
    errorText: {
      color: colors.error,
      textAlign: 'center',
      marginBottom: Spacing.two,
      fontWeight: '900',
      textTransform: 'uppercase',
      fontSize: 13,
    },
    retryButton: {
      backgroundColor: colors.error,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.two,
      borderRadius: 2,
      borderWidth: 2,
      borderColor: '#ffffff',
    },
    retryText: {
      color: '#ffffff',
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    emptyContainer: {
      padding: Spacing.six,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundElement,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.border,
      marginTop: Spacing.two,
      shadowColor: colors.border,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 0,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.four,
      fontWeight: '600',
    },
    emptyButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.two * 1.5,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: '#ffffff',
    },
    emptyButtonText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 13,
      textTransform: 'uppercase',
    },
    fab: {
      position: 'absolute',
      bottom: Spacing.four + Spacing.two,
      right: Spacing.four,
      backgroundColor: colors.accent,
      borderRadius: 4, // Sharp brutalist FAB
      borderWidth: 2,
      borderColor: '#ffffff',
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.three,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000000',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
    },
    fabText: {
      color: '#ffffff',
      fontWeight: '900',
      fontSize: 14,
      marginLeft: Spacing.one,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={{ marginTop: Spacing.two, color: colors.textSecondary }}>Loading your trips...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.appName}>SplitEasy 💸</Text>
            <Text style={styles.appSubtitle}>Smart DBMS-backed Expense Sharing</Text>
          </View>
        </View>
      </View>

      {/* Global Stat Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroText}>Active Expense Records</Text>
        <Text style={styles.heroStat}>{groups.length}</Text>
        <Text style={styles.heroDesc}>All sync'd in real-time with PostgreSQL</Text>
      </View>

      <Text style={styles.sectionTitle}>Your Groups / Trips</Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchGroups}>
            <Text style={styles.retryText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No expense records found. Start your first group!</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/create-group')}
              >
                <Text style={styles.emptyButtonText}>Create a Group</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.groupCard}
              activeOpacity={0.7}
              onPress={() => router.push(`/group/${item.id}`)}
            >
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupDate}>
                  Created: {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Indigo Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push('/create-group')}
      >
        <Text style={styles.fabText}>+ New Record</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
