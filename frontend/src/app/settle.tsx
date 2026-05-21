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

export default function SettleScreen() {
  const router = useRouter();
  const { groupId, debtorId, creditorId, amount } = useLocalSearchParams<{
    groupId: string;
    debtorId?: string;
    creditorId?: string;
    amount?: string;
  }>();

  const scheme = useColorScheme() || 'dark';
  const colors = Colors[scheme === 'unspecified' ? 'dark' : scheme];

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedDebtorId, setSelectedDebtorId] = useState('');
  const [selectedCreditorId, setSelectedCreditorId] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  // Success overlay states
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successDebtor, setSuccessDebtor] = useState('');
  const [successCreditor, setSuccessCreditor] = useState('');
  const [successAmount, setSuccessAmount] = useState(0);

  // Animated values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [bounceAnim] = useState(new Animated.Value(0));

  const triggerSettleAnimation = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.5);
    bounceAnim.setValue(0);

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
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -15,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    const fetchMembers = async () => {
      if (!groupId) return;
      try {
        const data = await apiService.getMembers(groupId);
        setMembers(data);

        // Prepopulate if query params are available
        if (debtorId) setSelectedDebtorId(debtorId);
        else if (data.length > 0) setSelectedDebtorId(data[0].id);

        if (creditorId) setSelectedCreditorId(creditorId);
        else if (data.length > 1) setSelectedCreditorId(data[1].id);

        if (amount) setSettleAmount(parseFloat(amount).toFixed(2));
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to retrieve group participants.');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [groupId, debtorId, creditorId, amount]);

  const handleSettle = async () => {
    const parsedAmt = parseFloat(settleAmount);

    if (!selectedDebtorId || !selectedCreditorId) {
      Alert.alert('Validation Error', 'Please select both the person paying and the person receiving.');
      return;
    }

    if (selectedDebtorId === selectedCreditorId) {
      Alert.alert('Validation Error', 'The payer and receiver cannot be the same person!');
      return;
    }

    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      Alert.alert('Validation Error', 'Please enter a positive numeric value for the settlement amount.');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.recordSettlement(groupId!, {
        debtor_id: selectedDebtorId,
        creditor_id: selectedCreditorId,
        amount: parsedAmt,
      });

      const debtorName = members.find((m) => m.id === selectedDebtorId)?.name || 'Payer';
      const creditorName = members.find((m) => m.id === selectedCreditorId)?.name || 'Receiver';

      setSuccessDebtor(debtorName);
      setSuccessCreditor(creditorName);
      setSuccessAmount(parsedAmt);
      setShowSuccessOverlay(true);
      triggerSettleAnimation();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to record settlement in local FastAPI backend.');
    } finally {
      setSubmitting(false);
    }
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
      color: colors.success,
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
    debtorSelected: {
      backgroundColor: colors.error,
      borderColor: colors.error,
    },
    creditorSelected: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    pickerItemText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    pickerItemTextSelected: {
      color: '#ffffff',
    },
    submitButton: {
      backgroundColor: colors.success,
      borderRadius: Spacing.three,
      padding: Spacing.three * 1.2,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.four,
      shadowColor: colors.success,
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
      shadowColor: colors.success,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    coinContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(52, 211, 153, 0.12)',
      borderWidth: 2,
      borderColor: colors.success,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.four,
    },
    coinText: {
      fontSize: 36,
      color: colors.success,
      fontWeight: 'bold',
    },
    overlayTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.success,
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
      backgroundColor: colors.success,
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
          <ActivityIndicator size="large" color={colors.success} />
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
          <Text style={styles.headerTitle}>Record Settlement</Text>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Who is paying? (Debtor)</Text>
          <View style={styles.pickerRow}>
            {members.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.pickerItem,
                  selectedDebtorId === item.id && styles.debtorSelected,
                ]}
                onPress={() => setSelectedDebtorId(item.id)}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    selectedDebtorId === item.id && styles.pickerItemTextSelected,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Who is receiving? (Creditor)</Text>
          <View style={styles.pickerRow}>
            {members.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.pickerItem,
                  selectedCreditorId === item.id && styles.creditorSelected,
                ]}
                onPress={() => setSelectedCreditorId(item.id)}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    selectedCreditorId === item.id && styles.pickerItemTextSelected,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Amount Paid (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            value={settleAmount}
            onChangeText={setSettleAmount}
            keyboardType="decimal-pad"
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.6 }]}
            onPress={handleSettle}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitText}>Record Settlement Payment</Text>
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
                styles.coinContainer,
                {
                  transform: [{ translateY: bounceAnim }],
                },
              ]}
            >
              <Text style={styles.coinText}>₹</Text>
            </Animated.View>
            <Text style={styles.overlayTitle}>Settlement Success! 💸</Text>
            <Text style={styles.overlayText}>
              <Text style={{ fontWeight: 'bold', color: colors.accent }}>{successDebtor}</Text>{' '}
              has successfully transferred{' '}
              <Text style={{ fontWeight: 'bold', color: colors.success }}>₹{successAmount.toFixed(2)}</Text>{' '}
              to{' '}
              <Text style={{ fontWeight: 'bold', color: colors.accent }}>{successCreditor}</Text>.
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
