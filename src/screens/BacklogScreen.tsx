import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SectionList, ScrollView, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getItems } from '../storage/storage';
import { Item, CATEGORIES, Category, Status } from '../data/types';
import { Colors, Fonts, Radius, Spacing } from '../theme/theme';
import { useEntrance, usePressScale } from '../hooks/useEntrance';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Filter = 'all' | 'backlog' | 'active' | 'paused' | 'completed';

type Section = { category: Category; data: Item[] };

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  backlog: 'Backlog',
  active: 'Active',
  paused: 'Paused',
  completed: 'Done',
};

const STATUS_COLORS: Record<Status, string> = {
  backlog: Colors.faded,
  active: Colors.forest,
  paused: Colors.gold,
  completed: Colors.oak,
};

// Animated card wrapper
function AnimatedCard({ item, index, onPress, onEdit }: {
  item: Item;
  index: number;
  onPress: () => void;
  onEdit: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const { scale, onPressIn, onPressOut } = usePressScale();

  useEffect(() => {
    const delay = Math.min(index * 55, 380);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        speed: 14,
        bounciness: 5,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const cat = Colors.category[item.category];
  const daysSince = Math.floor(
    (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={[styles.cardAccent, { backgroundColor: cat.bar }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
          </View>

          {item.status !== 'backlog' && (
            <View style={styles.progressRow}>
              <View style={styles.progressBg}>
                <Animated.View style={[styles.progressFill, { width: `${item.progress}%`, backgroundColor: cat.bar }]} />
              </View>
              <Text style={[styles.progressPct, { color: cat.bar }]}>{item.progress}%</Text>
            </View>
          )}

          <View style={styles.cardBottomRow}>
            <View style={[styles.badge, { backgroundColor: cat.bg }]}>
              <Text style={[styles.badgeText, { color: cat.text }]}>
                {CATEGORIES[item.category].toUpperCase()}
              </Text>
            </View>
            <View style={styles.cardActions}>
              {item.status !== 'backlog' && (
                <Text style={[
                  styles.daysAgo,
                  daysSince >= 5 && { color: Colors.crimson }
                ]}>
                  {daysSince === 0 ? 'today' : `${daysSince}d ago`}
                </Text>
              )}
              <TouchableOpacity
                onPress={onEdit}
                activeOpacity={0.7}
                style={styles.editBtn}
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function BacklogScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const navigation = useNavigation<Nav>();

  // Header entrance
  const { opacity: headerOpacity, translateY: headerY } = useEntrance(0);
  // Filters entrance
  const { opacity: filtersOpacity, translateY: filtersY } = useEntrance(80);

  // Track item count changes to re-key the list for entrance anim
  const [listKey, setListKey] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadItems);
    return unsubscribe;
  }, [navigation]);

  async function loadItems() {
    const all = await getItems();
    setItems(all);
    setListKey(k => k + 1);
  }

  const filtered = items.filter(i => {
    if (filter === 'all') return true;
    return i.status === filter;
  });

  const sections = Object.keys(CATEGORIES).reduce((acc, key) => {
    const cat = key as Category;
    const catItems = filtered.filter(i => i.category === cat);
    if (catItems.length > 0) acc.push({ category: cat, data: catItems });
    return acc;
  }, [] as Section[]);

  const counts: Record<Filter, number> = {
    all: items.length,
    backlog: items.filter(i => i.status === 'backlog').length,
    active: items.filter(i => i.status === 'active').length,
    paused: items.filter(i => i.status === 'paused').length,
    completed: items.filter(i => i.status === 'completed').length,
  };

  // Build flat index map for stagger
  const flatItems = sections.flatMap(s => s.data);

  function renderItem({ item }: { item: Item }) {
    const index = flatItems.indexOf(item);
    return (
      <AnimatedCard
        key={`${item.id}-${listKey}`}
        item={item}
        index={index}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
        onEdit={() => navigation.navigate('EditItem', { itemId: item.id })}
      />
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
      <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
        <Text style={styles.heading}>My List</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddItem')}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Filters */}
      <Animated.View style={{ opacity: filtersOpacity, transform: [{ translateY: filtersY }] }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {(Object.keys(FILTER_LABELS) as Filter[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {FILTER_LABELS[f]}
              </Text>
              {counts[f] > 0 && (
                <View style={[styles.countBadge, filter === f && { backgroundColor: Colors.crimson }]}>
                  <Text style={[styles.countBadgeText, filter === f && { color: Colors.surface }]}>
                    {counts[f]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing here yet.</Text>
          <Text style={styles.emptySub}>Tap + New to add something.</Text>
        </View>
      ) : (
        <SectionList
          key={listKey}
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
  heading: { fontFamily: Fonts.heading, fontSize: 24, color: Colors.ink },
  addButton: {
    backgroundColor: Colors.crimson, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  addButtonText: { fontFamily: Fonts.heading, fontSize: 13, color: Colors.surface, letterSpacing: 0.5 },
  filterRow: { paddingHorizontal: Spacing.lg, height: 60, paddingVertical: Spacing.md, gap: Spacing.sm },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 0.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterBtnActive: { backgroundColor: Colors.aged, borderColor: Colors.oak },
  filterText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.faded },
  filterTextActive: { fontFamily: Fonts.bodySemiBold, color: Colors.ink },
  countBadge: {
    backgroundColor: Colors.aged, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  countBadgeText: { fontFamily: Fonts.heading, fontSize: 10, color: Colors.sepia },
  list: { padding: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },
  sectionBadge: { borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  sectionBadgeText: { fontFamily: Fonts.heading, fontSize: 11, letterSpacing: 1 },
  sectionCount: { fontFamily: Fonts.body, fontSize: 13, color: Colors.faded },
  card: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.sm,
  },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  title: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.ink, flex: 1, marginRight: Spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressBg: { flex: 1, height: 4, backgroundColor: Colors.aged, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  progressPct: { fontFamily: Fonts.heading, fontSize: 11, minWidth: 30, textAlign: 'right' },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  badgeText: { fontFamily: Fonts.heading, fontSize: 10, letterSpacing: 0.5 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  daysAgo: { fontFamily: Fonts.body, fontSize: 11, color: Colors.faded },
  editBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  editBtnText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.sepia },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.sepia },
  emptySub: { fontFamily: Fonts.body, fontSize: 14, color: Colors.faded },
});
