import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts, Spacing, Radius } from '../theme/theme';

interface Task {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

const TASKS_KEY = '@focustracker:tasks';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    const json = await AsyncStorage.getItem(TASKS_KEY);
    if (json) setTasks(JSON.parse(json));
  }

  async function saveTasks(updated: Task[]) {
    setTasks(updated);
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
  }

  async function addTask() {
    if (!input.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: input.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    await saveTasks([newTask, ...tasks]);
    setInput('');
  }

  async function toggleTask(id: string) {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    await saveTasks(updated);
  }

  async function deleteTask(id: string) {
    Alert.alert('Delete task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await saveTasks(tasks.filter(t => t.id !== id));
        }
      }
    ]);
  }

  async function clearDone() {
    Alert.alert('Clear completed', 'Remove all done tasks?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => await saveTasks(tasks.filter(t => !t.done))
      }
    ]);
  }

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  const pending = tasks.filter(t => !t.done).length;
  const done = tasks.filter(t => t.done).length;

  function renderTask({ item }: { item: Task }) {
    return (
      <View style={styles.taskRow}>
        <TouchableOpacity
          style={[styles.checkbox, item.done && { backgroundColor: Colors.forest, borderColor: Colors.forest }]}
          onPress={() => toggleTask(item.id)}
          activeOpacity={0.75}
        >
          {item.done && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <Text style={[styles.taskText, item.done && styles.taskDone]} numberOfLines={2}>
          {item.text}
        </Text>
        <TouchableOpacity onPress={() => deleteTask(item.id)} activeOpacity={0.7}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Tasks</Text>
        {done > 0 && (
          <TouchableOpacity onPress={clearDone} activeOpacity={0.75}>
            <Text style={styles.clearText}>Clear done</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: Colors.crimson }]}>{pending}</Text>
          <Text style={styles.statLabel}>pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: Colors.forest }]}>{done}</Text>
          <Text style={styles.statLabel}>done</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: Colors.oak }]}>{tasks.length}</Text>
          <Text style={styles.statLabel}>total</Text>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'done'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a task..."
          placeholderTextColor={Colors.faded}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={addTask}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={addTask} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {filter === 'done' ? 'Nothing done yet.' : 'No tasks yet.'}
          </Text>
          <Text style={styles.emptySub}>
            {filter === 'all' ? 'Add something above.' : ''}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          renderItem={renderTask}
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
  heading: { fontFamily: Fonts.heading, fontSize: 24, color: Colors.ink },
  clearText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.crimson },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, gap: Spacing.xl,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  stat: { alignItems: 'center', gap: 2 },
  statNum: { fontFamily: Fonts.heading, fontSize: 22 },
  statLabel: { fontFamily: Fonts.body, fontSize: 11, color: Colors.faded },
  statDivider: { width: 0.5, height: 28, backgroundColor: Colors.border },
  filterRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  filterBtn: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md,
    alignItems: 'center', borderWidth: 0.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterBtnActive: { backgroundColor: Colors.aged, borderColor: Colors.oak },
  filterText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.faded },
  filterTextActive: { fontFamily: Fonts.bodySemiBold, color: Colors.ink },
  inputRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  input: {
    flex: 1, backgroundColor: Colors.surface, borderWidth: 0.5,
    borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontFamily: Fonts.body, fontSize: 14, color: Colors.ink,
  },
  addBtn: {
    backgroundColor: Colors.crimson, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, justifyContent: 'center',
  },
  addBtnText: { fontFamily: Fonts.heading, fontSize: 13, color: Colors.surface },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border,
    padding: Spacing.md,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkmark: { color: Colors.surface, fontSize: 12, fontWeight: '700' },
  taskText: { flex: 1, fontFamily: Fonts.body, fontSize: 14, color: Colors.ink },
  taskDone: { textDecorationLine: 'line-through', color: Colors.faded },
  deleteText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.faded },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.sepia },
  emptySub: { fontFamily: Fonts.body, fontSize: 14, color: Colors.faded },
});