import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { addItem } from '../storage/storage';
import { CATEGORIES, Category } from '../data/types';
import { Colors, Fonts, Radius, Spacing } from '../theme/theme';

const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];

export default function AddItemScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<Category>('book');

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title before saving.');
      return;
    }
    await addItem({ title: title.trim(), category, note: note.trim() });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="What do you want to conquer?"
          placeholderTextColor={Colors.faded}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORY_KEYS.map(key => {
            const cat = Colors.category[key];
            const selected = category === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.categoryBtn,
                  { backgroundColor: selected ? cat.bg : Colors.aged },
                  selected && styles.categoryBtnSelected,
                ]}
                onPress={() => setCategory(key)}
                activeOpacity={0.75}
              >
                <Text style={[
                  styles.categoryBtnText,
                  { color: selected ? cat.text : Colors.faded },
                ]}>
                  {CATEGORIES[key].toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Note <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Author, studio, platform..."
          placeholderTextColor={Colors.faded}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Add to Backlog</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  label: {
    fontFamily: Fonts.heading,
    fontSize: 12,
    color: Colors.sepia,
    letterSpacing: 1.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  optional: {
    fontFamily: Fonts.bodyItalic,
    fontSize: 12,
    color: Colors.faded,
    letterSpacing: 0,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.ink,
  },
  inputMultiline: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryBtn: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  categoryBtnSelected: {
    borderWidth: 1.5,
    borderColor: Colors.oak,
  },
  categoryBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    letterSpacing: 1,
  },
  saveBtn: {
    backgroundColor: Colors.crimson,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  saveBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    color: Colors.surface,
    letterSpacing: 1.5,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  cancelBtnText: {
    fontFamily: Fonts.bodyItalic,
    fontSize: 14,
    color: Colors.faded,
  },
});