import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, Switch, Alert, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getReminders, saveReminders } from '../storage/storage';
import { Reminder } from '../data/types';
import { Colors, Fonts, Radius, Spacing } from '../theme/theme';
import { registerBackgroundTask } from '../notifications/backgroundTask';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { requestPermissions, scheduleReminder, cancelReminder } from '../notifications/notifications';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadReminders);
    return unsubscribe;
  }, [navigation]);

  async function loadReminders() {
    const data = await getReminders();
    setReminders(data);
  }

  async function handleToggle(reminder: Reminder) {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Permission required', 'Enable notifications in your device settings.');
      return;
    }

    const updated = reminders.map(r =>
      r.id === reminder.id ? { ...r, enabled: !r.enabled } : r
    );
    setReminders(updated);
    await saveReminders(updated);

    if (!reminder.enabled) {
      await scheduleReminder(
        reminder.id,
        '📖 Time for your quest',
        `Time to make progress!`,
        reminder.hour,
        reminder.minute,
        reminder.days
      );
    } else {
      await cancelReminder(reminder.id);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete reminder', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await cancelReminder(id);
          const updated = reminders.filter(r => r.id !== id);
          setReminders(updated);
          await saveReminders(updated);
        }
      }
    ]);
  }

  function formatTime(hour: number, minute: number) {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  function renderItem({ item }: { item: Reminder }) {
    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: item.enabled ? Colors.forest : Colors.faded }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text style={styles.time}>{formatTime(item.hour, item.minute)}</Text>
            <Switch
              value={item.enabled}
              onValueChange={() => handleToggle(item)}
              trackColor={{ false: Colors.aged, true: Colors.forest + '88' }}
              thumbColor={item.enabled ? Colors.forest : Colors.faded}
            />
          </View>

          <View style={styles.daysRow}>
            {DAY_LABELS.map((label, i) => (
              <View
                key={i}
                style={[
                  styles.dayDot,
                  item.days.includes(i + 1) && styles.dayDotActive,
                ]}
              >
                <Text style={[
                  styles.dayLabel,
                  item.days.includes(i + 1) && styles.dayLabelActive,
                ]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Text style={styles.deleteText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Reminders</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddReminder')}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
  style={{ 
    margin: Spacing.lg, 
    padding: Spacing.sm, 
    backgroundColor: Colors.oak, 
    borderRadius: Radius.md,
    alignItems: 'center'
  }}
  onPress={async () => {
    try {
      await BackgroundFetch.fetchAsync('check-abandonment');
      Alert.alert('Done', 'Abandonment check ran successfully.');
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  }}
>
  <Text style={{ fontFamily: Fonts.heading, color: Colors.surface, fontSize: 12, letterSpacing: 1 }}>
    TEST ABANDONMENT CHECK
  </Text>
</TouchableOpacity>

      {reminders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No reminders set.</Text>
          <Text style={styles.emptySubtext}>Tap + New to summon your first alarm.</Text>
        </View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={r => r.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.base },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  heading: { fontFamily: Fonts.heading, fontSize: 24, color: Colors.ink, letterSpacing: 1 },
  addButton: {
    backgroundColor: Colors.crimson, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  addButtonText: { fontFamily: Fonts.heading, fontSize: 13, color: Colors.surface, letterSpacing: 1 },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  card: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.sm,
  },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { fontFamily: Fonts.heading, fontSize: 28, color: Colors.ink, letterSpacing: 1 },
  daysRow: { flexDirection: 'row', gap: Spacing.xs },
  dayDot: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.aged, borderWidth: 0.5, borderColor: Colors.border,
  },
  dayDotActive: { backgroundColor: Colors.oak },
  dayLabel: { fontFamily: Fonts.heading, fontSize: 11, color: Colors.faded },
  dayLabelActive: { color: Colors.surface },
  deleteText: { fontFamily: Fonts.bodyItalic, fontSize: 13, color: Colors.crimson },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyTitle: { fontFamily: Fonts.heading, fontSize: 16, color: Colors.sepia, letterSpacing: 1 },
  emptySubtext: { fontFamily: Fonts.bodyItalic, fontSize: 14, color: Colors.faded },
});