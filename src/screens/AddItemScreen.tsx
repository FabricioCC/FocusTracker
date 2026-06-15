import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addItem } from '../storage/storage';
import { CATEGORIES, Category, CATEGORY_UNIT, CATEGORY_TOTAL_LABEL } from '../data/types';
import { Colors, Fonts, Radius, Spacing } from '../theme/theme';
import { useEntrance, usePressScale } from '../hooks/useEntrance';

const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];

export default function AddItemScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<Category>('book');
  const [total, setTotal] = useState('');

  // Entrance animations
  const { opacity, translateY } = useEntrance(0);

  // Save button press scale
  const { scale: saveScale, onPressIn: savePressIn, onPressOut: savePressOut } = usePressScale(0.96);

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title before saving.');
      return;
    }
    if (!total.trim() || isNaN(Number(total)) || Number(total) <= 0) {
      Alert.alert('Missing total', `Please enter the total ${CATEGORY_UNIT[category]}.`);
      return;
    }
    await addItem({
      title: title.trim(),
      category,
      note: note.trim(),
      total: Number(total),
    });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>New Item</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Animated.ScrollView
          contentContainerStyle={styles.scroll}
          style={{ opacity, transform: [{ translateY }] }}
        >

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

          <Text style={styles.label}>{CATEGORY_TOTAL_LABEL[category]}</Text>
          <TextInput
            style={styles.input}
            placeholder={`e.g. ${category === 'book' || category === 'tech_book' ? '320' : category === 'course' || category === 'game' ? '12' : '120'}`}
            placeholderTextColor={Colors.faded}
            value={total}
            onChangeText={setTotal}
            keyboardType="numeric"
          />
          <Text style={styles.unitHint}>
            Unit: {CATEGORY_UNIT[category]}
          </Text>

          <Text style={styles.label}>
            Note <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Author, studio, platform..."
            placeholderTextColor={Colors.faded}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />

          <Animated.View style={{ transform: [{ scale: saveScale }] }}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              onPressIn={savePressIn}
              onPressOut={savePressOut}
              activeOpacity={1}
            >
              <Text style={styles.saveBtnText}>Add to Backlog</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.base },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  topBarTitle: { fontFamily: Fonts.heading, fontSize: 18, color: Colors.ink, letterSpacing: 0.5 },
  closeBtn: { padding: Spacing.xs },
  closeBtnText: { fontFamily: Fonts.body, fontSize: 16, color: Colors.faded },
  scroll: { padding: Spacing.lg, gap: Spacing.sm },
  label: {
    fontFamily: Fonts.heading, fontSize: 12, color: Colors.sepia,
    letterSpacing: 1.5, marginTop: Spacing.md, marginBottom: Spacing.xs,
  },
  optional: {
    fontFamily: Fonts.bodyItalic, fontSize: 12,
    color: Colors.faded, letterSpacing: 0,
  },
  unitHint: {
    fontFamily: Fonts.bodyItalic, fontSize: 12,
    color: Colors.faded, marginTop: 4,
  },
  input: {
    backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontFamily: Fonts.body, fontSize: 15, color: Colors.ink,
  },
  inputMultiline: {
    height: 90, textAlignVertical: 'top', paddingTop: Spacing.sm,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryBtn: {
    borderRadius: Radius.sm, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderWidth: 0.5, borderColor: Colors.border,
  },
  categoryBtnSelected: { borderWidth: 1.5, borderColor: Colors.oak },
  categoryBtnText: { fontFamily: Fonts.heading, fontSize: 11, letterSpacing: 1 },
  saveBtn: {
    backgroundColor: Colors.crimson, borderRadius: Radius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.lg,
  },
  saveBtnText: {
    fontFamily: Fonts.heading, fontSize: 14,
    color: Colors.surface, letterSpacing: 1.5,
  },
  cancelBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  cancelBtnText: { fontFamily: Fonts.bodyItalic, fontSize: 14, color: Colors.faded },
});