import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getItems, updateItem, logProgress } from '../storage/storage';
import { Item, CATEGORIES, Status, CATEGORY_UNIT } from '../data/types';
import { Colors, Fonts, Radius, Spacing } from '../theme/theme';
import { usePressScale } from '../hooks/useEntrance';

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

// Animated section that fades + slides in with a stagger delay
function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, speed: 14, bounciness: 3, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// Animated progress bar
function AnimatedProgressBar({ progress, color }: { progress: number; color: string }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: progress,
      speed: 6,
      bounciness: 2,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressBg}>
      <Animated.View style={[styles.progressFill, { width, backgroundColor: color }]} />
    </View>
  );
}

// Animated status button with press scale
function StatusButton({ status, active, color, onPress }: {
  status: Status;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.93);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          styles.statusBtn,
          active && { backgroundColor: color + '22', borderColor: color },
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <Text style={[styles.statusBtnText, { color: active ? color : Colors.faded }]}>
          {STATUS_LABELS[status].toUpperCase()}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ItemDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { itemId } = route.params;

  const [item, setItem] = useState<Item | null>(null);
  const [currentInput, setCurrentInput] = useState('');
  const [logNote, setLogNote] = useState('');

  useEffect(() => {
    loadItem();
  }, []);

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

  if (!item) return null;

  const cat = Colors.category[item.category];
  const unit = CATEGORY_UNIT[item.category];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <AnimatedSection delay={0}>
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
        </AnimatedSection>

        <View style={styles.divider} />

        {/* Progress */}
        <AnimatedSection delay={100}>
          <Text style={styles.sectionLabel}>Progress</Text>
          <View style={styles.progressRow}>
            <AnimatedProgressBar progress={item.progress} color={cat.bar} />
            <Text style={[styles.progressPct, { color: cat.bar }]}>{item.progress}%</Text>
          </View>
          <Text style={styles.progressDetail}>
            {item.current} / {item.total} {unit}
          </Text>
        </AnimatedSection>

        {/* Log progress */}
        {item.status === 'active' && (
          <AnimatedSection delay={180}>
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
          </AnimatedSection>
        )}

        <View style={styles.divider} />

        {/* Status */}
        <AnimatedSection delay={260}>
          <Text style={styles.sectionLabel}>Change Status</Text>
          <View style={styles.statusGrid}>
            {(Object.keys(STATUS_LABELS) as Status[]).map(s => (
              <StatusButton
                key={s}
                status={s}
                active={item.status === s}
                color={STATUS_COLORS[s]}
                onPress={() => handleStatusChange(s)}
              />
            ))}
          </View>
        </AnimatedSection>

        <View style={styles.divider} />

        {/* History */}
        {item.logs.length > 0 && (
          <AnimatedSection delay={340}>
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
          </AnimatedSection>
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
