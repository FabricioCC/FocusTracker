import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, TextInput, Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getItems, updateItem, logProgress } from '../storage/storage';
import { Item, CATEGORIES, Status } from '../data/types';
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

export default function ItemDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { itemId } = route.params;

  const [item, setItem] = useState<Item | null>(null);
  const [logText, setLogText] = useState('');
  const [percentage, setPercentage] = useState('');

  useEffect(() => {
    loadItem();
  }, []);

  async function loadItem() {
    const all = await getItems();
    const found = all.find(i => i.id === itemId);
    if (found) setItem(found);
  }

  async function handleStatusChange(status: Status) {
    await updateItem(itemId, { status });
    await loadItem();
  }

  async function handleLogProgress() {
    if (!logText.trim()) {
      Alert.alert('Empty log', 'Describe what you did.');
      return;
    }
    const pct = parseInt(percentage) || item?.progress || 0;
    await logProgress(itemId, logText.trim(), pct);
    setLogText('');
    setPercentage('');
    await loadItem();
  }

  if (!item) return null;

  const cat = Colors.category[item.category];
  const progressWidth = `${item.progress}%`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

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
            <View style={[styles.progressFill, { width: progressWidth, backgroundColor: cat.bar }]} />
          </View>
          <Text style={[styles.progressPct, { color: cat.bar }]}>{item.progress}%</Text>
        </View>

        {/* Log progress */}
        {item.status === 'active' && (
          <View style={styles.logBox}>
            <Text style={styles.sectionLabel}>Log Progress</Text>
            <TextInput
              style={styles.input}
              placeholder="What did you do? (e.g. read 20 pages)"
              placeholderTextColor={Colors.faded}
              value={logText}
              onChangeText={setLogText}
            />
            <View style={styles.logRow}>
              <TextInput
                style={[styles.input, styles.inputSmall]}
                placeholder="% done"
                placeholderTextColor={Colors.faded}
                value={percentage}
                onChangeText={setPercentage}
                keyboardType="numeric"
                maxLength={3}
              />
              <TouchableOpacity style={styles.logBtn} onPress={handleLogProgress} activeOpacity={0.8}>
                <Text style={styles.logBtnText}>Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        {/* Status actions */}
        <Text style={styles.sectionLabel}>Change Status</Text>
        <View style={styles.statusGrid}>
          {(Object.keys(STATUS_LABELS) as Status[]).map(s => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusBtn,
                item.status === s && { backgroundColor: STATUS_COLORS[s] + '22', borderColor: STATUS_COLORS[s] },
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
                <View style={styles.logItemLeft}>
                  <View style={[styles.logDot, { backgroundColor: cat.bar }]} />
                </View>
                <View style={styles.logItemRight}>
                  <Text style={styles.logDesc}>{log.description}</Text>
                  <View style={styles.logMeta}>
                    <Text style={styles.logPct}>{log.percentage}%</Text>
                    <Text style={styles.logDate}>
                      {new Date(log.date).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric'
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
  title: { fontFamily: Fonts.heading, fontSize: 22, color: Colors.ink, letterSpacing: 0.5, marginTop: Spacing.xs },
  note: { fontFamily: Fonts.bodyItalic, fontSize: 14, color: Colors.faded },
  divider: { height: 0.5, backgroundColor: Colors.border, marginVertical: Spacing.md },
  sectionLabel: { fontFamily: Fonts.heading, fontSize: 11, color: Colors.sepia, letterSpacing: 1.5, marginBottom: Spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressBg: { flex: 1, height: 6, backgroundColor: Colors.aged, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressPct: { fontFamily: Fonts.heading, fontSize: 13, minWidth: 36, textAlign: 'right' },
  logBox: { gap: Spacing.sm, marginTop: Spacing.sm },
  input: {
    backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontFamily: Fonts.body, fontSize: 14, color: Colors.ink,
  },
  inputSmall: { flex: 1 },
  logRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  logBtn: {
    backgroundColor: Colors.crimson, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  logBtnText: { fontFamily: Fonts.heading, fontSize: 13, color: Colors.surface, letterSpacing: 1 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statusBtn: {
    borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 0.5, borderColor: Colors.border,
  },
  statusBtnText: { fontFamily: Fonts.heading, fontSize: 11, letterSpacing: 1 },
  logItem: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  logItemLeft: { paddingTop: 5 },
  logDot: { width: 7, height: 7, borderRadius: 4 },
  logItemRight: { flex: 1, gap: 2 },
  logDesc: { fontFamily: Fonts.body, fontSize: 14, color: Colors.ink },
  logMeta: { flexDirection: 'row', gap: Spacing.sm },
  logPct: { fontFamily: Fonts.heading, fontSize: 12, color: Colors.faded },
  logDate: { fontFamily: Fonts.bodyItalic, fontSize: 12, color: Colors.faded },
});