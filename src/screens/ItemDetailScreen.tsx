import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, AppState
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getItems, updateItem, logProgress } from '../storage/storage';
import { Item, CATEGORIES, Status, CATEGORY_UNIT } from '../data/types';
import { Colors, Fonts, Radius, Spacing } from '../theme/theme';

type Route = RouteProp<RootStackParamList, 'ItemDetail'>;

const STATUS_LABELS: Record<Status, string> = {
  backlog: 'Backlog',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
};

const STATUS_COLORS: Record<Status, string> = {
  backlog: Colors.faded,
  active: Colors.forest,
  paused: Colors.gold,
  completed: Colors.oak,
};

const POMODORO_WORK = 25 * 60;
const POMODORO_BREAK = 5 * 60;

export default function ItemDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { itemId } = route.params;

  const [item, setItem] = useState<Item | null>(null);
  const [currentInput, setCurrentInput] = useState('');
  const [logNote, setLogNote] = useState('');

  // pomodoro
  const [pomodoroSeconds, setPomodoroSeconds] = useState(POMODORO_WORK);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadItem();
  }, []);

  // pomodoro timer
  useEffect(() => {
    if (pomodoroRunning) {
      intervalRef.current = setInterval(() => {
        setPomodoroSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setPomodoroRunning(false);
            const nextIsBreak = !isBreak;
            setIsBreak(nextIsBreak);
            setPomodoroSeconds(nextIsBreak ? POMODORO_BREAK : POMODORO_WORK);
            return nextIsBreak ? POMODORO_BREAK : POMODORO_WORK;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pomodoroRunning, isBreak]);

  async function loadItem() {
    const all = await getItems();
    const found = all.find(i => i.id === itemId);
    if (found) {
      setItem(found);
      setCurrentInput(found.current.toString());
    }
  }

  async function handleStatusChange(status: Status) {
    await updateItem(itemId, { status });
    await loadItem();
  }

  async function handleLogProgress() {
    const current = parseInt(currentInput);
    if (isNaN(current) || current < 0) {
      Alert.alert('Invalid value', 'Please enter a valid number.');
      return;
    }
    if (item && current > item.total) {
      Alert.alert('Exceeds total', `Max is ${item.total} ${CATEGORY_UNIT[item.category]}.`);
      return;
    }
    const note = logNote.trim() || `Updated to ${current} ${CATEGORY_UNIT[item!.category]}`;
    await logProgress(itemId, current, note);
    setLogNote('');
    await loadItem();
  }

  function formatPomodoro(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function resetPomodoro() {
    setPomodoroRunning(false);
    setIsBreak(false);
    setPomodoroSeconds(POMODORO_WORK);
  }

  if (!item) return null;

  const cat = Colors.category[item.category];
  const unit = CATEGORY_UNIT[item.category];
  const pomodoroProgress = isBreak
    ? 1 - pomodoroSeconds / POMODORO_BREAK
    : 1 - pomodoroSeconds / POMODORO_WORK;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.topRow}>
          <View style={[styles.badge, { backgroundColor: cat.bg }]}>
            <Text style={[styles.badgeText, { color: cat.text }]}>
              {CATEGORIES[item.category].toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status]}
          </Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        {item.note ? <Text style={styles.note}>{item.note}</Text> : null}

        <View style={styles.divider} />

        {/* Progress */}
        <Text style={styles.sectionLabel}>Progress</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBg}>
            <View style={[
              styles.progressFill,
              { width: `${item.progress}%`, backgroundColor: cat.bar }
            ]} />
          </View>
          <Text style={[styles.progressPct, { color: cat.bar }]}>{item.progress}%</Text>
        </View>
        <Text style={styles.progressDetail}>
          {item.current} / {item.total} {unit}
        </Text>

        {/* Log progress */}
        {item.status === 'active' && (
          <View style={styles.logBox}>
            <Text style={styles.sectionLabel}>Update Progress</Text>
            <View style={styles.logRow}>
              <TextInput
                style={[styles.input, styles.inputSmall]}
                placeholder={`Current ${unit}`}
                placeholderTextColor={Colors.faded}
                value={currentInput}
                onChangeText={setCurrentInput}
                keyboardType="numeric"
              />
              <Text style={styles.totalHint}>/ {item.total} {unit}</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Note (optional)"
              placeholderTextColor={Colors.faded}
              value={logNote}
              onChangeText={setLogNote}
            />
            <TouchableOpacity style={styles.logBtn} onPress={handleLogProgress} activeOpacity={0.8}>
              <Text style={styles.logBtnText}>Save Progress</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.divider} />

        {/* Pomodoro */}
        <Text style={styles.sectionLabel}>Pomodoro</Text>
        <View style={styles.pomodoroCard}>
          <Text style={styles.pomodoroMode}>{isBreak ? 'Break' : 'Focus'}</Text>
          <Text style={styles.pomodoroTime}>{formatPomodoro(pomodoroSeconds)}</Text>

          <View style={styles.pomodoroBarBg}>
            <View style={[
              styles.pomodoroBarFill,
              {
                width: `${pomodoroProgress * 100}%`,
                backgroundColor: isBreak ? Colors.forest : Colors.crimson,
              }
            ]} />
          </View>

          <View style={styles.pomodoroButtons}>
            <TouchableOpacity
              style={[styles.pomodoroBtn, { backgroundColor: isBreak ? Colors.forest : Colors.crimson }]}
              onPress={() => setPomodoroRunning(r => !r)}
              activeOpacity={0.8}
            >
              <Text style={styles.pomodoroBtnText}>
                {pomodoroRunning ? 'Pause' : 'Start'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pomodoroResetBtn}
              onPress={resetPomodoro}
              activeOpacity={0.75}
            >
              <Text style={styles.pomodoroResetText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Status */}
        <Text style={styles.sectionLabel}>Change Status</Text>
        <View style={styles.statusGrid}>
          {(Object.keys(STATUS_LABELS) as Status[]).map(s => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusBtn,
                item.status === s && {
                  backgroundColor: STATUS_COLORS[s] + '22',
                  borderColor: STATUS_COLORS[s],
                },
              ]}
              onPress={() => handleStatusChange(s)}
              activeOpacity={0.75}
            >
              <Text style={[
                styles.statusBtnText,
                { color: item.status === s ? STATUS_COLORS[s] : Colors.faded },
              ]}>
                {STATUS_LABELS[s].toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {/* History */}
        {item.logs.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>History</Text>
            {[...item.logs].reverse().map((log, i) => (
              <View key={i} style={styles.logItem}>
                <View style={[styles.logDot, { backgroundColor: cat.bar }]} />
                <View style={styles.logItemRight}>
                  <Text style={styles.logDesc}>{log.description}</Text>
                  <View style={styles.logMeta}>
                    <Text style={styles.logUnit}>{log.current} {unit}</Text>
                    <Text style={styles.logDate}>
                      {new Date(log.date).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.base },
  scroll: { padding: Spacing.lg, gap: Spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  badge: { borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  badgeText: { fontFamily: Fonts.heading, fontSize: 10, letterSpacing: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: Fonts.bodyItalic, fontSize: 13 },
  title: {
    fontFamily: Fonts.heading, fontSize: 22,
    color: Colors.ink, letterSpacing: 0.5, marginTop: Spacing.xs,
  },
  note: { fontFamily: Fonts.bodyItalic, fontSize: 14, color: Colors.faded },
  divider: { height: 0.5, backgroundColor: Colors.border, marginVertical: Spacing.md },
  sectionLabel: {
    fontFamily: Fonts.heading, fontSize: 11,
    color: Colors.sepia, letterSpacing: 1.5, marginBottom: Spacing.sm,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressBg: { flex: 1, height: 6, backgroundColor: Colors.aged, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressPct: { fontFamily: Fonts.heading, fontSize: 13, minWidth: 36, textAlign: 'right' },
  progressDetail: {
    fontFamily: Fonts.bodyItalic, fontSize: 13,
    color: Colors.faded, marginTop: 4,
  },
  logBox: { gap: Spacing.sm, marginTop: Spacing.sm },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  input: {
    backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontFamily: Fonts.body, fontSize: 14, color: Colors.ink,
  },
  inputSmall: { flex: 1 },
  totalHint: { fontFamily: Fonts.bodyItalic, fontSize: 13, color: Colors.faded },
  logBtn: {
    backgroundColor: Colors.crimson, borderRadius: Radius.md,
    paddingVertical: Spacing.sm, alignItems: 'center',
  },
  logBtnText: {
    fontFamily: Fonts.heading, fontSize: 13,
    color: Colors.surface, letterSpacing: 1,
  },
  pomodoroCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 0.5, borderColor: Colors.border,
    padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm,
  },
  pomodoroMode: {
    fontFamily: Fonts.heading, fontSize: 12,
    color: Colors.faded, letterSpacing: 2,
  },
  pomodoroTime: {
    fontFamily: Fonts.heading, fontSize: 52,
    color: Colors.ink, letterSpacing: 2,
  },
  pomodoroBarBg: {
    width: '100%', height: 4,
    backgroundColor: Colors.aged, borderRadius: 2, overflow: 'hidden',
  },
  pomodoroBarFill: { height: 4, borderRadius: 2 },
  pomodoroButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  pomodoroBtn: {
    borderRadius: Radius.md, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  pomodoroBtnText: {
    fontFamily: Fonts.heading, fontSize: 14,
    color: Colors.surface, letterSpacing: 1,
  },
  pomodoroResetBtn: {
    borderRadius: Radius.md, paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, borderWidth: 0.5, borderColor: Colors.border,
  },
  pomodoroResetText: { fontFamily: Fonts.bodyItalic, fontSize: 14, color: Colors.faded },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statusBtn: {
    borderRadius: Radius.sm, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderWidth: 0.5, borderColor: Colors.border,
  },
  statusBtnText: { fontFamily: Fonts.heading, fontSize: 11, letterSpacing: 1 },
  logItem: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  logDot: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  logItemRight: { flex: 1, gap: 2 },
  logDesc: { fontFamily: Fonts.body, fontSize: 14, color: Colors.ink },
  logMeta: { flexDirection: 'row', gap: Spacing.sm },
  logUnit: { fontFamily: Fonts.heading, fontSize: 12, color: Colors.faded },
  logDate: { fontFamily: Fonts.bodyItalic, fontSize: 12, color: Colors.faded },
});