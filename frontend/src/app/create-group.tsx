import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Spacing, Colors } from '@/constants/theme';
import { apiService } from '@/services/api';

export default function CreateGroupScreen() {
  const router = useRouter();
  const scheme = useColorScheme() || 'dark';
  const colors = Colors[scheme === 'unspecified' ? 'dark' : scheme];

  const [groupName, setGroupName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddMember = () => {
    const trimmed = memberName.trim();
    if (!trimmed) return;

    if (members.map(m => m.toLowerCase()).includes(trimmed.toLowerCase())) {
      Alert.alert('Duplicate Member', `${trimmed} has already been added to this group.`);
      return;
    }

    setMembers([...members, trimmed]);
    setMemberName('');
  };

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleCreateGroup = async () => {
    if (submitting) return;

    const trimmedGroupName = groupName.trim();
    if (!trimmedGroupName) {
      Alert.alert('Validation Error', 'Please enter a name for the record file (e.g. GoaTrip).');
      return;
    }

    if (members.length < 2) {
      Alert.alert(
        'Validation Error',
        'An expense-sharing group must have at least 2 members. Please add more people!'
      );
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the Group
      const newGroup = await apiService.createGroup(trimmedGroupName);

      // 2. Batch-add the members
      const memberPayload = members.map((name) => ({ name }));
      await apiService.addMembers(newGroup.id, memberPayload);

      if (Platform.OS === 'web') {
        window.alert(`Record file "${trimmedGroupName}" successfully initialized!`);
        router.replace('/');
      } else {
        Alert.alert('Success', `Record file "${trimmedGroupName}" successfully initialized!`, [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/');
            },
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      if (Platform.OS === 'web') {
        window.alert('Failed to create group. Make sure the backend server is running.');
      } else {
        Alert.alert('Error', 'Failed to create group. Make sure the backend server is running.');
      }
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
      fontSize: 16,
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
    memberInputRow: {
      flexDirection: 'row',
      marginBottom: Spacing.three,
    },
    memberInput: {
      flex: 1,
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Spacing.two,
      padding: Spacing.three,
      color: colors.text,
      fontSize: 16,
      marginRight: Spacing.two,
    },
    addButton: {
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.four,
      borderRadius: Spacing.two,
    },
    addButtonText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: Spacing.four,
      minHeight: 50,
    },
    chip: {
      flexDirection: 'row',
      backgroundColor: colors.background === '#F9FAFB' ? '#E2E8F0' : 'rgba(127, 109, 242, 0.12)',
      borderWidth: 1,
      borderColor: colors.background === '#F9FAFB' ? '#CBD5E1' : 'rgba(127, 109, 242, 0.25)',
      borderRadius: 20,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.one * 1.5,
      marginRight: Spacing.two,
      marginBottom: Spacing.two,
      alignItems: 'center',
    },
    chipText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    removeChip: {
      marginLeft: Spacing.one * 1.5,
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.error,
    },
    submitButton: {
      backgroundColor: colors.accent,
      borderRadius: Spacing.three,
      padding: Spacing.three * 1.2,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.four,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
      elevation: 5,
    },
    disabledButton: {
      backgroundColor: colors.background === '#F9FAFB' ? '#CBD5E1' : '#2D2D2D',
      shadowOpacity: 0,
      elevation: 0,
    },
    submitText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    emptyChipsText: {
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: Spacing.one,
    },
  });

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
                router.replace('/');
              }
            }}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Initialize New Record</Text>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Record File Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. GoaTrip, flatmates-2026"
            placeholderTextColor={colors.textSecondary}
            value={groupName}
            onChangeText={setGroupName}
            maxLength={50}
          />

          <Text style={styles.label}>Add Participants</Text>
          <View style={styles.memberInputRow}>
            <TextInput
              style={styles.memberInput}
              placeholder="Enter participant's name"
              placeholderTextColor={colors.textSecondary}
              value={memberName}
              onChangeText={setMemberName}
              onSubmitEditing={handleAddMember}
              maxLength={30}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddMember}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>People Included ({members.length})</Text>
          <View style={styles.chipsContainer}>
            {members.length === 0 ? (
              <Text style={styles.emptyChipsText}>No people added yet.</Text>
            ) : (
              members.map((name, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveMember(index)}>
                    <Text style={styles.removeChip}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (submitting || !groupName.trim() || members.length < 2) && styles.disabledButton,
            ]}
            onPress={handleCreateGroup}
            disabled={submitting || !groupName.trim() || members.length < 2}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitText}>Initialize Record File</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
