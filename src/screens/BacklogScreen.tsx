import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, SectionList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getItems } from '../storage/storage';
import { Item, CATEGORIES, Category } from '../data/types';
import { Colors, Fonts, Radius, Spacing } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Section = {
  category: Category;
  data: Item[];
};

export default function BacklogScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadItems);
    return unsubscribe;
  }, [navigation]);

  async function loadItems() {
    const all = await getItems();
    const backlog = all.filter(i => i.status === 'backlog');

    const grouped = Object.keys(CATEGORIES).reduce((acc, key) => {
      const cat = key as Category;
      const items = backlog.filter(i => i.category === cat);
      if (items.length > 0) acc.push({ category: cat, data: items });
      return acc;
    }, [] as Section[]);

    setSections(grouped);
  }

  function renderItem({ item }: { item: Item }) {
    const cat = Colors.category[item.category];
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
        activeOpacity={0.75}
      >
        <View style={[styles.cardAccent, { backgroundColor: cat.bar }]} />
        <View style={styles.cardContent}>
          <Text style={styles.title}>{item.title}</Text>
          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
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
        <Text style={styles.heading}>Backlog</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddItem')}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No scrolls yet.</Text>
          <Text style={styles.emptySubtext}>Tap + New to begin your journey.</Text>
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
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: Colors.ink,
    letterSpacing: 1,
  },
  addButton: {
    backgroundColor: Colors.crimson,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  addButtonText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    color: Colors.surface,
    letterSpacing: 1,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  sectionBadgeText: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  sectionCount: {
    fontFamily: Fonts.bodyItalic,
    fontSize: 13,
    color: Colors.faded,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  cardAccent: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  note: {
    fontFamily: Fonts.bodyItalic,
    fontSize: 13,
    color: Colors.faded,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Colors.sepia,
    letterSpacing: 1,
  },
  emptySubtext: {
    fontFamily: Fonts.bodyItalic,
    fontSize: 14,
    color: Colors.faded,
  },
});