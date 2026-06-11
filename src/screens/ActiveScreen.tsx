import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, SectionList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getItems } from '../storage/storage';
import { Item, CATEGORIES, Category, Status } from '../data/types';
import { Colors, Fonts, Radius, Spacing } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Section = {
  category: Category;
  data: Item[];
};

const STATUS_COLORS: Record<Status, string> = {
  backlog: Colors.faded,
  active: Colors.forest,
  paused: Colors.gold,
  completed: Colors.oak,
};

export default function ActiveScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const [totalPaused, setTotalPaused] = useState(0);
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadItems);
    return unsubscribe;
  }, [navigation]);

  async function loadItems() {
    const all = await getItems();
    const inProgress = all.filter(i => i.status === 'active' || i.status === 'paused');

    setTotalActive(inProgress.filter(i => i.status === 'active').length);
    setTotalPaused(inProgress.filter(i => i.status === 'paused').length);

    const grouped = Object.keys(CATEGORIES).reduce((acc, key) => {
      const cat = key as Category;
      const items = inProgress.filter(i => i.category === cat);
      if (items.length > 0) acc.push({ category: cat, data: items });
      return acc;
    }, [] as Section[]);

    setSections(grouped);
  }

  function renderItem({ item }: { item: Item }) {
    const cat = Colors.category[item.category];
    const daysSince = Math.floor(
      (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
        activeOpacity={0.75}
      >
        <View style={[styles.cardAccent, { backgroundColor: cat.bar }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${item.progress}%`, backgroundColor: cat.bar }]} />
            </View>
            <Text style={[styles.progressPct, { color: cat.bar }]}>{item.progress}%</Text>
          </View>

          <View style={styles.cardBottomRow}>
            {item.note ? <Text style={styles.note}>{item.note}</Text> : <View />}
            <Text style={[
              styles.daysAgo,
              daysSince >= 5 && { color: Colors.crimson }
            ]}>
              {daysSince === 0 ? 'today' : `${daysSince}d ago`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderSectionHeader({ section }: { section: Section }) {
    const cat = Colors.category[section.category];
    return (
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionBadge, { backgroundColor: cat.bg }]}>
          <Text style={[styles.sectionBadgeText, { color: cat.text }]}>
            {CATEGORIES[section.category].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.sectionCount}>{section.data.length}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Active</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: Colors.forest }]}>{totalActive}</Text>
            <Text style={styles.statLabel}>active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: Colors.gold }]}>{totalPaused}</Text>
            <Text style={styles.statLabel}>paused</Text>
          </View>
        </View>
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing in progress.</Text>
          <Text style={styles.emptySubtext}>Start something from your backlog.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
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
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stat: { alignItems: 'center' },
  statNum: { fontFamily: Fonts.heading, fontSize: 18 },
  statLabel: { fontFamily: Fonts.bodyItalic, fontSize: 11, color: Colors.faded },
  statDivider: { width: 0.5, height: 24, backgroundColor: Colors.border },
  list: { padding: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },
  sectionBadge: { borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  sectionBadgeText: { fontFamily: Fonts.heading, fontSize: 11, letterSpacing: 1.5 },
  sectionCount: { fontFamily: Fonts.bodyItalic, fontSize: 13, color: Colors.faded },
  card: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.sm,
  },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.ink, flex: 1, marginRight: Spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressBg: { flex: 1, height: 5, backgroundColor: Colors.aged, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  progressPct: { fontFamily: Fonts.heading, fontSize: 12, minWidth: 32, textAlign: 'right' },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  note: { fontFamily: Fonts.bodyItalic, fontSize: 12, color: Colors.faded, flex: 1 },
  daysAgo: { fontFamily: Fonts.bodyItalic, fontSize: 12, color: Colors.faded },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyTitle: { fontFamily: Fonts.heading, fontSize: 16, color: Colors.sepia, letterSpacing: 1 },
  emptySubtext: { fontFamily: Fonts.bodyItalic, fontSize: 14, color: Colors.faded },
});