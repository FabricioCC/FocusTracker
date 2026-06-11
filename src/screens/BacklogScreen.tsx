import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getItems } from '../storage/storage';
import { Item, CATEGORIES } from '../data/types';
import { Colors, Fonts, Radius, Spacing } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BacklogScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadItems);
    return unsubscribe;
  }, [navigation]);

  async function loadItems() {
    const all = await getItems();
    setItems(all.filter(i => i.status === 'backlog'));
  }

  function renderItem({ item }: { item: Item }) {
    const cat = Colors.category[item.category];
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
        activeOpacity={0.75}
      >
        <View style={styles.cardAccent} />
        <View style={styles.cardContent}>
          <View style={[styles.badge, { backgroundColor: cat.bg }]}>
            <Text style={[styles.badgeText, { color: cat.text }]}>
              {CATEGORIES[item.category].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
        </View>
      </TouchableOpacity>
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

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No scrolls yet.</Text>
          <Text style={styles.emptySubtext}>Tap + New to begin your journey.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
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
    paddingTop: 36,
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
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardAccent: {
    width: 4,
    backgroundColor: Colors.crimson,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    letterSpacing: 1,
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