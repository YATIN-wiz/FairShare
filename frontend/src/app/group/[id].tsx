import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Spacing, Colors, Fonts } from '@/constants/theme';
import {
  apiService,
  Group,
  Expense,
  Member,
  MemberBalance,
  DebtSimplified,
} from '@/services/api';

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() || 'dark';
  const colors = Colors[scheme === 'unspecified' ? 'dark' : scheme];

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState<DebtSimplified[]>([]);

  const [activeTab, setActiveTab] = useState<'expenses' | 'debts' | 'balances'>('expenses');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllData = async () => {
    if (!id) return;
    try {
      const [groupInfo, expensesList, membersList, summaryInfo] = await Promise.all([
        apiService.getGroup(id),
        apiService.getExpenses(id),
        apiService.getMembers(id),
        apiService.getSummary(id),
      ]);

      setGroup(groupInfo);
      setExpenses(expensesList);
      setMembers(membersList);
      setBalances(summaryInfo.balances);
      setSimplifiedDebts(summaryInfo.simplified_debts);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Connection Error', 'Failed to retrieve data from local FastAPI backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [id])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  const performReset = async () => {
    if (!id) return;
    try {
      setLoading(true);
      await apiService.resetGroup(id);
      if (Platform.OS === 'web') {
        window.alert('All balances settled and record file reset successfully!');
      } else {
        Alert.alert('Success', 'All balances settled and record file reset successfully!');
      }
      loadAllData();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to reset record file.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRecord = () => {
    if (Platform.OS === 'web') {
      const confirmReset = window.confirm(
        'Do you want to settle all debts and clear the expense history for this record? This will reset all balances back to zero.'
      );
      if (confirmReset) {
        performReset();
      }
    } else {
      Alert.alert(
        'Export & Settle Balances',
        'Do you want to settle all debts and clear the expense history for this record? This will reset all balances back to zero.',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Settle All',
            style: 'destructive',
            onPress: performReset,
          },
        ]
      );
    }
  };

  const handleDeleteGroup = () => {
    const performDelete = async () => {
      if (!id) return;
      try {
        setLoading(true);
        await apiService.deleteGroup(id);
        if (Platform.OS === 'web') {
          window.alert('Group/Trip successfully deleted!');
        } else {
          Alert.alert('Success', 'Group/Trip successfully deleted!');
        }
        router.replace('/');
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to delete group/trip.');
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(
        'WARNING: Are you absolutely sure you want to delete this group/trip? This will permanently delete all participants, expenses, splits, and settlements. This action CANNOT be undone!'
      );
      if (confirmDelete) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Group/Trip',
        'WARNING: Are you absolutely sure you want to delete this group/trip? This will permanently delete all participants, expenses, splits, and settlements. This action CANNOT be undone!',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Permanently',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    const performDelete = async () => {
      if (!id) return;
      try {
        setLoading(true);
        await apiService.deleteExpense(id, expenseId);
        if (Platform.OS === 'web') {
          window.alert('Expense successfully deleted!');
        } else {
          Alert.alert('Success', 'Expense successfully deleted!');
        }
        loadAllData();
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to delete expense.');
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm('Are you sure you want to delete this expense?');
      if (confirmDelete) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Expense',
        'Are you sure you want to delete this expense?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  };

  const getMemberName = (memberId: string) => {
    return members.find((m) => m.id === memberId)?.name || 'Unknown';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.three,
      backgroundColor: colors.backgroundElement,
      borderBottomWidth: 3,
      borderBottomColor: colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      marginRight: Spacing.three,
      paddingVertical: Spacing.one,
    },
    backText: {
      fontSize: 24,
      color: colors.accent,
      fontWeight: '900',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.text,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    resetButton: {
      backgroundColor: 'rgba(248, 113, 113, 0.08)',
      borderWidth: 2,
      borderColor: colors.error,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.one * 1.5,
      borderRadius: 4,
    },
    resetText: {
      color: colors.error,
      fontSize: 11,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    deleteGroupButton: {
      backgroundColor: 'rgba(248, 113, 113, 0.08)',
      borderWidth: 2,
      borderColor: colors.error,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.one * 1.5,
      borderRadius: 4,
    },
    deleteGroupText: {
      color: colors.error,
      fontSize: 11,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    quickStats: {
      flexDirection: 'row',
      backgroundColor: '#1E1E2E',
      padding: Spacing.four,
      margin: Spacing.four,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.accent,
      justifyContent: 'space-between',
      shadowColor: colors.accent,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.8,
      shadowRadius: 0,
      elevation: 4,
    },
    statBox: {
      flex: 1,
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 11,
      color: '#A5B4FC',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '900',
      color: '#ffffff',
      marginTop: Spacing.one,
      fontFamily: Fonts.mono,
    },
    tabBar: {
      flexDirection: 'row',
      marginHorizontal: Spacing.four,
      marginBottom: Spacing.three,
      backgroundColor: colors.background === '#F9FAFB' ? '#E2E8F0' : '#202020',
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 4,
      padding: Spacing.half,
    },
    tabButton: {
      flex: 1,
      paddingVertical: Spacing.two * 1.2,
      alignItems: 'center',
      borderRadius: 2,
    },
    activeTabButton: {
      backgroundColor: colors.accent,
      borderWidth: 1,
      borderColor: '#ffffff',
    },
    tabText: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    activeTabText: {
      color: '#ffffff',
    },
    listContainer: {
      paddingHorizontal: Spacing.four,
      paddingBottom: Spacing.six * 2.8,
    },
    card: {
      backgroundColor: colors.backgroundElement,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 4,
      padding: Spacing.four,
      marginBottom: Spacing.three,
      shadowColor: colors.accent,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 0,
      elevation: 3,
    },
    expenseTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    expenseDescription: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.text,
    },
    expenseAmount: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.accent,
      fontFamily: Fonts.mono,
    },
    expenseMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.three,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: Spacing.two * 1.5,
    },
    metaLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      fontFamily: Fonts.mono,
    },
    metaValue: {
      fontWeight: 'bold',
      color: colors.text,
      marginTop: Spacing.half,
    },
    expenseActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: Spacing.three,
      marginTop: Spacing.three,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: Spacing.two * 1.5,
    },
    actionButton: {
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.one * 1.5,
      borderRadius: 4,
      borderWidth: 2,
    },
    editButton: {
      borderColor: colors.accent,
      backgroundColor: 'rgba(127, 109, 242, 0.08)',
    },
    editButtonText: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    deleteButton: {
      borderColor: colors.error,
      backgroundColor: 'rgba(248, 113, 113, 0.08)',
    },
    deleteButtonText: {
      color: colors.error,
      fontSize: 11,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    debtRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.one,
    },
    debtorText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    settleLink: {
      backgroundColor: 'rgba(52, 211, 153, 0.08)',
      borderWidth: 2,
      borderColor: colors.success,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
      borderRadius: 4,
    },
    settleLinkText: {
      color: colors.success,
      fontSize: 11,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.three,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    balanceName: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.text,
    },
    balanceNumbers: {
      alignItems: 'flex-end',
    },
    creditText: {
      color: colors.success,
      fontWeight: '900',
      fontFamily: Fonts.mono,
    },
    oweText: {
      color: colors.error,
      fontWeight: '900',
      fontFamily: Fonts.mono,
    },
    neutralText: {
      color: colors.textSecondary,
      fontFamily: Fonts.mono,
    },
    fabRow: {
      position: 'absolute',
      bottom: Spacing.four,
      left: Spacing.four,
      right: Spacing.four,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.three,
    },
    fabAddExpense: {
      flex: 1.5,
      backgroundColor: colors.accent,
      borderRadius: 4, // Sharp brutalist FAB
      borderWidth: 2,
      borderColor: '#ffffff',
      paddingVertical: Spacing.three * 1.2,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      elevation: 6,
      shadowColor: '#000000',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
    },
    fabSettle: {
      flex: 1,
      backgroundColor: colors.success,
      borderRadius: 4, // Sharp brutalist FAB
      borderWidth: 2,
      borderColor: '#ffffff',
      paddingVertical: Spacing.three * 1.2,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      elevation: 6,
      shadowColor: '#000000',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
    },
    fabText: {
      color: '#ffffff',
      fontWeight: '900',
      fontSize: 13,
      marginLeft: Spacing.one,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });

  const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {group?.name || 'Group Details'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetRecord}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteGroupButton} onPress={handleDeleteGroup}>
            <Text style={styles.deleteGroupText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick stats panel */}
      <View style={styles.quickStats}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total spent</Text>
          <Text style={styles.statValue}>₹{totalSpent.toFixed(2)}</Text>
        </View>
        <View style={{ width: 1, backgroundColor: colors.border }} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Participants</Text>
          <Text style={styles.statValue}>{members.length}</Text>
        </View>
        <View style={{ width: 1, backgroundColor: colors.border }} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Expenses logged</Text>
          <Text style={styles.statValue}>{expenses.length}</Text>
        </View>
      </View>

      {/* Custom Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'expenses' && styles.activeTabButton]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'debts' && styles.activeTabButton]}
          onPress={() => setActiveTab('debts')}
        >
          <Text style={[styles.tabText, activeTab === 'debts' && styles.activeTabText]}>
            Balances
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'balances' && styles.activeTabButton]}
          onPress={() => setActiveTab('balances')}
        >
          <Text style={[styles.tabText, activeTab === 'balances' && styles.activeTabText]}>
            Summary
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Tab Screens */}
      {activeTab === 'expenses' && (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={{ padding: Spacing.six, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' }}>
                No expenses logged in this trip yet. Click "+ Add Expense" below!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.expenseTitleRow}>
                <Text style={styles.expenseDescription}>{item.description}</Text>
                <Text style={styles.expenseAmount}>₹{parseFloat(item.amount).toFixed(2)}</Text>
              </View>
              <View style={styles.expenseMetaRow}>
                <View>
                  <Text style={styles.metaLabel}>Paid By</Text>
                  <Text style={styles.metaValue}>{getMemberName(item.payer_id)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.metaLabel}>Split With</Text>
                  <Text style={styles.metaValue}>
                    {item.splits.length === members.length ? 'Everyone' : `${item.splits.length} people`}
                  </Text>
                </View>
              </View>
              <View style={styles.expenseActionsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() =>
                    router.push({
                      pathname: '/add-expense',
                      params: { groupId: id, expenseId: item.id },
                    })
                  }
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteExpense(item.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {activeTab === 'debts' && (
        <FlatList
          data={simplifiedDebts}
          keyExtractor={(_, index) => `debt-${index}`}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={{ padding: Spacing.six, alignItems: 'center' }}>
              <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
                🎉 Outstanding balances are settled!
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: Spacing.one, textAlign: 'center' }}>
                No simplified transactions left to pay.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.debtRow}>
                <Text style={styles.debtorText}>
                  {getMemberName(item.debtor_id)} owes {getMemberName(item.creditor_id)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                  <Text style={{ fontWeight: '900', color: colors.error, fontFamily: Fonts.mono }}>
                    ₹{parseFloat(String(item.amount)).toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    style={styles.settleLink}
                    onPress={() =>
                      router.push({
                        pathname: '/settle',
                        params: {
                          groupId: id,
                          debtorId: item.debtor_id,
                          creditorId: item.creditor_id,
                          amount: item.amount.toString(),
                        },
                      })
                    }
                  >
                    <Text style={styles.settleLinkText}>Settle</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {activeTab === 'balances' && (
        <FlatList
          data={balances}
          keyExtractor={(item) => item.member_id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          renderItem={({ item }) => {
            const val = parseFloat(item.net_balance);
            return (
              <View style={styles.balanceRow}>
                <Text style={styles.balanceName}>{getMemberName(item.member_id)}</Text>
                <View style={styles.balanceNumbers}>
                  {val > 0.01 ? (
                    <Text style={styles.creditText}>gets back ₹{val.toFixed(2)}</Text>
                  ) : val < -0.01 ? (
                    <Text style={styles.oweText}>owes ₹{Math.abs(val).toFixed(2)}</Text>
                  ) : (
                    <Text style={styles.neutralText}>settled</Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Floating dual FAB row */}
      <View style={styles.fabRow}>
        <TouchableOpacity
          style={styles.fabAddExpense}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: '/add-expense',
              params: { groupId: id },
            })
          }
        >
          <Text style={styles.fabText}>+ Add Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fabSettle}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: '/settle',
              params: { groupId: id },
            })
          }
        >
          <Text style={styles.fabText}>Settle Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
