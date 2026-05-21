import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Animated,
  Easing,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Spacing, Colors } from '@/constants/theme';
import { apiService, Member } from '@/services/api';

export default function AddExpenseScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const scheme = useColorScheme() || 'dark';
  const colors = Colors[scheme === 'unspecified' ? 'dark' : scheme];

  const [members, setMembers] = useState<Member[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  
  // Custom splitting states
  const [splitWithAll, setSplitWithAll] = useState(true);
  const [selectedSplitMemberIds, setSelectedSplitMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Success overlay states
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successDescription, setSuccessDescription] = useState('');
  const [successAmount, setSuccessAmount] = useState(0);
  const [successSplitCount, setSuccessSplitCount] = useState(0);

  // Animated values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [spinAnim] = useState(new Animated.Value(0));

  const triggerSplitAnimation = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.5);
    spinAnim.setValue(0);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    const fetchMembers = async () => {
      if (!groupId) return;
      try {
        const data = await apiService.getMembers(groupId);
        setMembers(data);
        if (data.length > 0) {
          // Set first member as default payer
          setPayerId(data[0].id);
          // Set everyone as selected by default for custom splits
          setSelectedSplitMemberIds(data.map((m) => m.id));
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to retrieve group participants.');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [groupId]);

  const handleToggleMember = (memberId: string) => {
    if (selectedSplitMemberIds.includes(memberId)) {
      setSelectedSplitMemberIds(selectedSplitMemberIds.filter((id) => id !== memberId));
    } else {
      setSelectedSplitMemberIds([...selectedSplitMemberIds, memberId]);
    }
  };

  const handleAddExpense = async () => {
    const trimmedDesc = description.trim();
    const parsedAmt = parseFloat(amount);

    if (!trimmedDesc) {
      Alert.alert('Validation Error', 'Please enter a name/description for this expense (e.g. Dinner).');
      return;
    }

    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      Alert.alert('Validation Error', 'Please enter a positive numeric value for the expense amount.');
      return;
    }

    if (!payerId) {
      Alert.alert('Validation Error', 'Please select the person who paid for this expense.');
      return;
    }

    // Determine who we are splitting with
    const splitIds = splitWithAll ? members.map((m) => m.id) : selectedSplitMemberIds;

    if (splitIds.length === 0) {
      Alert.alert('Validation Error', 'You must select at least one person to split this expense with.');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createExpense(groupId!, {
        description: trimmedDesc,
        amount: parsedAmt,
        payer_id: payerId,
        split_member_ids: splitIds,
      });

      setSuccessDescription(trimmedDesc);
      setSuccessAmount(parsedAmt);
      setSuccessSplitCount(splitIds.length);
      setShowSuccessOverlay(true);
      triggerSplitAnimation();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save expense to FastAPI backend.');
    } finally {
      setSubmitting(false);
    }
  };

  // Live split calculator
  const getLiveSplitShare = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return 0;
    const splitCount = splitWithAll ? members.length : selectedSplitMemberIds.length;
    return splitCount > 0 ? val / splitCount : 0;
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
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: Spacing.three,
    },
    backText: {
      fontSize: 24,
      color: colors.accent,
      fontWeight: 'bold',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    form: {
      padding: Spacing.four,
      flex: 1,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.two,
      marginTop: Spacing.three,
    },
    input: {
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Spacing.two,
      padding: Spacing.three,
      color: colors.text,
      fontSize: 16,
      marginBottom: Spacing.three,
    },
    pickerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
      marginBottom: Spacing.three,
    },
    pickerItem: {
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.two,
    },
    pickerItemSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    pickerItemText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    pickerItemTextSelected: {
      color: '#ffffff',
    },
    toggleRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      marginBottom: Spacing.three,
    },
    toggleButton: {
      flex: 1,
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.two,
      alignItems: 'center',
      borderRadius: Spacing.two,
    },
    toggleButtonSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    toggleTextSelected: {
      color: '#ffffff',
      fontWeight: 'bold',
    },
    shareIndicator: {
      backgroundColor: colors.background === '#F9FAFB' ? '#E2E8F0' : 'rgba(52, 211, 153, 0.08)',
      padding: Spacing.three,
      borderRadius: Spacing.two,
      marginBottom: Spacing.three,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.background === '#F9FAFB' ? '#CBD5E1' : 'rgba(52, 211, 153, 0.25)',
    },
    shareTitle: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    shareAmount: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.success,
      marginTop: Spacing.one,
    },
    submitButton: {
      backgroundColor: colors.accent,
      borderRadius: Spacing.three,
      padding: Spacing.three * 1.2,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.four,
      marginBottom: Spacing.six * 2,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
      elevation: 5,
    },
    submitText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    overlayContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    overlayCard: {
      width: '85%',
      maxWidth: 340,
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Spacing.three,
      padding: Spacing.five,
      alignItems: 'center',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    splitIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(127, 109, 242, 0.12)',
      borderWidth: 2,
      borderColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.four,
    },
    splitIconText: {
      fontSize: 36,
    },
    overlayTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.accent,
      textAlign: 'center',
      marginBottom: Spacing.three,
    },
    overlayText: {
      fontSize: 15,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Spacing.five,
    },
    overlayButton: {
      backgroundColor: colors.accent,
      paddingVertical: Spacing.two * 1.5,
      paddingHorizontal: Spacing.five,
      borderRadius: Spacing.two,
      width: '100%',
      alignItems: 'center',
    },
    overlayButtonText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 16,
    },
  });

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace(`/group/${groupId}`);
              }
            }}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>What was this expense for?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Lunch, Taxi, Hotel Booking"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            maxLength={100}
          />

          <Text style={styles.label}>How much did it cost? (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Who paid for this?</Text>
          <View style={styles.pickerRow}>
            {members.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.pickerItem, payerId === item.id && styles.pickerItemSelected]}
                onPress={() => setPayerId(item.id)}
              >
                <Text style={[styles.pickerItemText, payerId === item.id && styles.pickerItemTextSelected]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Split Type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, splitWithAll && styles.toggleButtonSelected]}
              onPress={() => setSplitWithAll(true)}
            >
              <Text style={[styles.pickerItemText, splitWithAll && styles.toggleTextSelected]}>
                Split Equally With Everyone
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !splitWithAll && styles.toggleButtonSelected]}
              onPress={() => setSplitWithAll(false)}
            >
              <Text style={[styles.pickerItemText, !splitWithAll && styles.toggleTextSelected]}>
                Split With Specific People
              </Text>
            </TouchableOpacity>
          </View>

          {!splitWithAll && (
            <>
              <Text style={styles.label}>Select people sharing cost:</Text>
              <View style={styles.pickerRow}>
                {members.map((item) => {
                  const isSelected = selectedSplitMemberIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                      onPress={() => handleToggleMember(item.id)}
                    >
                      <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                        {item.name} {isSelected ? '✓' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Live Math share card */}
          {parseFloat(amount) > 0 && (
            <View style={styles.shareIndicator}>
              <Text style={styles.shareTitle}>
                Each participant owes ({splitWithAll ? members.length : selectedSplitMemberIds.length} splitters)
              </Text>
              <Text style={styles.shareAmount}>₹{getLiveSplitShare().toFixed(2)}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.6 }]}
            onPress={handleAddExpense}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitText}>Save Expense</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {showSuccessOverlay && (
        <View style={styles.overlayContainer}>
          <Animated.View
            style={[
              styles.overlayCard,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.splitIconContainer,
                {
                  transform: [
                    {
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.splitIconText}>📊</Text>
            </Animated.View>
            <Text style={styles.overlayTitle}>Expense Split! 💸</Text>
            <Text style={styles.overlayText}>
              Logged <Text style={{ fontWeight: 'bold', color: colors.accent }}>"{successDescription}"</Text> for{' '}
              <Text style={{ fontWeight: 'bold', color: colors.success }}>₹{successAmount.toFixed(2)}</Text>.{'\n'}
              Equally split among{' '}
              <Text style={{ fontWeight: 'bold', color: colors.accent }}>{successSplitCount}</Text> members (₹
              {(successAmount / successSplitCount).toFixed(2)} each).
            </Text>
            <TouchableOpacity
              style={styles.overlayButton}
              activeOpacity={0.8}
              onPress={() => {
                Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => {
                  setShowSuccessOverlay(false);
                  router.back();
                });
              }}
            >
              <Text style={styles.overlayButtonText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}
