import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Switch, Alert, Platform, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getReminders, saveReminders } from '../storage/storage';
import { Reminder } from '../data/types';
import { Colors, Fonts, Radius, Spacing } from '../theme/theme';
import { requestPermissions, scheduleReminder, cancelReminder } from '../notifications/notifications';
import { useEntrance, usePressScale } from '../hooks/useEntrance';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Animated reminder card
function AnimatedReminderCard({ item, index, onToggle, onDelete }: {
  item: Reminder;
  index: number;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const delay = Math.min(index * 70, 350);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, speed: 14, bounciness: 5, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  function formatTime(hour: number, minute: number) {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: item.enabled ? Colors.forest : Colors.faded }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text style={styles.time}>{formatTime(item.hour, item.minute)}</Text>
            <Switch
              value={item.enabled}
              onValueChange={onToggle}
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

          <TouchableOpacity onPress={onDelete} activeOpacity={0.75}>
            <Text style={styles.deleteText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [listKey, setListKey] = useState(0);
  const navigation = useNavigation<Nav>();

  // Header entrance
  const { opacity: headerOpacity, translateY: headerY } = useEntrance(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadReminders);
    return unsubscribe;
  }, [navigation]);

  async function loadReminders() {
    const data = await getReminders();
    setReminders(data);
    setListKey(k => k + 1);
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
        reminder.days,
        reminder.id
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

  function renderItem({ item, index }: { item: Reminder; index: number }) {
    return (
      <AnimatedReminderCard
        key={`${item.id}-${listKey}`}
        item={item}
        index={index}
        onToggle={() => handleToggle(item)}
        onDelete={() => handleDelete(item.id)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
        <Text style={styles.heading}>Reminders</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddReminder')}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </Animated.View>

      {reminders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No reminders set.</Text>
          <Text style={styles.emptySubtext}>Tap + New to summon your first alarm.</Text>
        </View>
      ) : (
        <FlatList
          key={listKey}
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
