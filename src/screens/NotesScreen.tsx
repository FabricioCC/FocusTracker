import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, TextInput, Alert, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts, Spacing, Radius } from '../theme/theme';

interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

const NOTES_KEY = '@focustracker:notes';

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadNotes(); }, []);

  async function loadNotes() {
    const json = await AsyncStorage.getItem(NOTES_KEY);
    if (json) setNotes(JSON.parse(json));
  }

  async function saveNotes(updated: Note[]) {
    setNotes(updated);
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updated));
  }

  function openNew() {
    setEditingNote(null);
    setTitle('');
    setBody('');
    setModalVisible(true);
  }

  function openEdit(note: Note) {
    setEditingNote(note);
    setTitle(note.title);
    setBody(note.body);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!title.trim() && !body.trim()) {
      setModalVisible(false);
      return;
    }

    if (editingNote) {
      const updated = notes.map(n =>
        n.id === editingNote.id
          ? { ...n, title: title.trim(), body: body.trim(), updatedAt: new Date().toISOString() }
          : n
      );
      await saveNotes(updated);
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: title.trim() || 'Untitled',
        body: body.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveNotes([newNote, ...notes]);
    }
    setModalVisible(false);
  }

  async function deleteNote(id: string) {
    Alert.alert('Delete note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => await saveNotes(notes.filter(n => n.id !== id))
      }
    ]);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.body.toLowerCase().includes(search.toLowerCase())
  );

  function renderNote({ item }: { item: Note }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openEdit(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardAccent} />
        <View style={styles.cardContent}>
          <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
          {item.body ? (
            <Text style={styles.noteBody} numberOfLines={2}>{item.body}</Text>
          ) : null}
          <Text style={styles.noteDate}>{formatDate(item.updatedAt)}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteNote(item.id)} activeOpacity={0.7} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Notes</Text>
        <TouchableOpacity style={styles.addButton} onPress={openNew} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          placeholderTextColor={Colors.faded}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Count */}
      {notes.length > 0 && (
        <Text style={styles.countText}>{filtered.length} note{filtered.length !== 1 ? 's' : ''}</Text>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {search ? 'No results.' : 'No notes yet.'}
          </Text>
          <Text style={styles.emptySub}>
            {search ? 'Try a different search.' : 'Tap + New to write something.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={n => n.id}
          renderItem={renderNote}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Modal editor */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleSave}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingNote ? 'Edit Note' : 'New Note'}
            </Text>
            <TouchableOpacity onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor={Colors.faded}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <View style={styles.modalDivider} />

          <TextInput
            style={styles.bodyInput}
            placeholder="Start writing..."
            placeholderTextColor={Colors.faded}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
        </KeyboardAvoidingView>
      </Modal>
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
  searchRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  searchInput: {
    backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontFamily: Fonts.body, fontSize: 14, color: Colors.ink,
  },
  countText: {
    fontFamily: Fonts.body, fontSize: 12, color: Colors.faded,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  card: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 0.5, borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardAccent: { width: 4, backgroundColor: Colors.gold },
  cardContent: { flex: 1, padding: Spacing.md, gap: 4 },
  noteTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.ink },
  noteBody: { fontFamily: Fonts.body, fontSize: 13, color: Colors.sepia, lineHeight: 18 },
  noteDate: { fontFamily: Fonts.body, fontSize: 11, color: Colors.faded, marginTop: 4 },
  deleteBtn: { padding: Spacing.md, justifyContent: 'center' },
  deleteText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.faded },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.sepia },
  emptySub: { fontFamily: Fonts.body, fontSize: 14, color: Colors.faded },
  modalContainer: { flex: 1, backgroundColor: Colors.base },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  modalTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.ink },
  modalCancel: { fontFamily: Fonts.body, fontSize: 15, color: Colors.faded },
  modalSave: { fontFamily: Fonts.heading, fontSize: 15, color: Colors.crimson },
  titleInput: {
    fontFamily: Fonts.heading, fontSize: 22, color: Colors.ink,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
  },
  modalDivider: { height: 0.5, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  bodyInput: {
    flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.ink,
    lineHeight: 24, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg,
  },
});