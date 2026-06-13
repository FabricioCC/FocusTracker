import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getReminders, saveReminders, getItems } from '../storage/storage';
import { Reminder, Item } from '../data/types';
import { Colors, Fonts, Radius, Spacing } from '../theme/theme';
import { setAlarm, requestAlarmPermission } from '../notifications/alarm';
import { CATEGORIES, Category, CATEGORY_UNIT } from '../data/types';


const DAYS = [
  { label: 'Sun', value: 1 },
  { label: 'Mon', value: 2 },
  { label: 'Tue', value: 3 },
  { label: 'Wed', value: 4 },
  { label: 'Thu', value: 5 },
  { label: 'Fri', value: 6 },
  { label: 'Sat', value: 7 },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export default function AddReminderScreen() {
  const navigation = useNavigation();
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [selectedDays, setSelectedDays] = useState<number[]>([2, 3, 4, 5, 6]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useEffect(() => {
    loadActiveItems();
  }, []);

  async function loadActiveItems() {
    const all = await getItems();
    const active = all.filter(i => i.status === 'active');
    setItems(active);
    if (active.length > 0) setSelectedItem(active[0]);
  }

  function toggleDay(day: number) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  function pad(n: number) {
    return n.toString().padStart(2, '0');
  }

  async function handleSave() {
  if (!selectedItem) {
    Alert.alert('No item selected', 'Move an item to Active first.');
    return;
  }
  if (selectedDays.length === 0) {
    Alert.alert('No days selected', 'Pick at least one day.');
    return;
  }

  const granted = await requestAlarmPermission();
  if (!granted) {
    Alert.alert('Permission required', 'Enable notifications in settings.');
    return;
  }

  try {
    const alarmId = Date.now().toString();

    await setAlarm({
      id: alarmId,
      itemId: selectedItem.id,
      itemTitle: selectedItem.title,
      itemProgress: selectedItem.progress,
      itemCurrent: selectedItem.current,
      itemTotal: selectedItem.total,
      itemUnit: CATEGORY_UNIT[selectedItem.category],
      hour,
      minute,
      days: selectedDays,
    });

    const newReminder: Reminder = {
      id: alarmId,
      alarmId: parseInt(alarmId) % 100000,
      itemId: selectedItem.id,
      itemTitle: selectedItem.title,
      hour,
      minute,
      days: selectedDays.sort(),
      enabled: true,
    };

    const existing = await getReminders();
    await saveReminders([...existing, newReminder]);
    Alert.alert('Done!', 'Reminder set successfully.');
    navigation.goBack();
  } catch (e) {
    console.error('Alarm error:', e);
    Alert.alert('Error', String(e));
  }
}

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Item selector */}
        <Text style={styles.label}>Item</Text>
        {items.length === 0 ? (
          <View style={styles.emptyItems}>
            <Text style={styles.emptyItemsText}>No active items.</Text>
            <Text style={styles.emptyItemsSub}>Move an item to Active first.</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.itemsRow}
          >
            {items.map(item => {
              const cat = Colors.category[item.category];
              const selected = selectedItem?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemBtn,
                    { borderColor: selected ? cat.bar : Colors.border },
                    selected && { backgroundColor: cat.bg },
                  ]}
                  onPress={() => setSelectedItem(item)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.itemBtnText, { color: selected ? cat.text : Colors.faded }]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Hour picker */}
        <Text style={styles.label}>Hour</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerRow}
        >
          {HOURS.map(h => (
            <TouchableOpacity
              key={h}
              style={[styles.pickerItem, hour === h && styles.pickerItemActive]}
              onPress={() => setHour(h)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pickerText, hour === h && styles.pickerTextActive]}>
                {pad(h)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Minute picker */}
        <Text style={styles.label}>Minute</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerRow}
        >
          {MINUTES.map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.pickerItem, minute === m && styles.pickerItemActive]}
              onPress={() => setMinute(m)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pickerText, minute === m && styles.pickerTextActive]}>
                {pad(m)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Preview */}
        <View style={styles.previewBox}>
          <Text style={styles.previewTime}>{pad(hour)}:{pad(minute)}</Text>
          {selectedItem && (
            <Text style={styles.previewItem}>{selectedItem.title}</Text>
          )}
          <Text style={styles.previewLabel}>daily reminder</Text>
        </View>

        {/* Days */}
        <Text style={styles.label}>Days</Text>
        <View style={styles.daysRow}>
          {DAYS.map(day => (
            <TouchableOpacity
              key={day.value}
              style={[
                styles.dayBtn,
                selectedDays.includes(day.value) && styles.dayBtnActive,
              ]}
              onPress={() => toggleDay(day.value)}
              activeOpacity={0.75}
            >
              <Text style={[
                styles.dayText,
                selectedDays.includes(day.value) && styles.dayTextActive,
              ]}>
                {day.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Presets */}
        <Text style={styles.label}>Presets</Text>
        <View style={styles.presetsRow}>
          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => setSelectedDays([2, 3, 4, 5, 6])}
          >
            <Text style={styles.presetText}>Weekdays</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => setSelectedDays([1, 7])}
          >
            <Text style={styles.presetText}>Weekend</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => setSelectedDays([1, 2, 3, 4, 5, 6, 7])}
          >
            <Text style={styles.presetText}>Every day</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Set Reminder</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.base },
  scroll: { padding: Spacing.lg, gap: Spacing.sm },
  label: {
    fontFamily: Fonts.heading, fontSize: 12, color: Colors.sepia,
    letterSpacing: 1.5, marginTop: Spacing.md, marginBottom: Spacing.sm,
  },
  emptyItems: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border,
    padding: Spacing.lg, alignItems: 'center',
  },
  emptyItemsText: { fontFamily: Fonts.heading, fontSize: 14, color: Colors.sepia },
  emptyItemsSub: { fontFamily: Fonts.bodyItalic, fontSize: 13, color: Colors.faded, marginTop: 4 },
  itemsRow: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  itemBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  itemBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 13 },
  pickerRow: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  pickerItem: {
    width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center',
    justifyContent: 'center', backgroundColor: Colors.surface,
    borderWidth: 0.5, borderColor: Colors.border,
  },
  pickerItemActive: { backgroundColor: Colors.crimson, borderColor: Colors.crimson },
  pickerText: { fontFamily: Fonts.heading, fontSize: 15, color: Colors.faded },
  pickerTextActive: { color: Colors.surface },
  previewBox: {
    alignItems: 'center', paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 0.5, borderColor: Colors.border, marginVertical: Spacing.sm,
    gap: 4,
  },
  previewTime: { fontFamily: Fonts.heading, fontSize: 48, color: Colors.ink, letterSpacing: 2 },
  previewItem: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.sepia },
  previewLabel: { fontFamily: Fonts.bodyItalic, fontSize: 13, color: Colors.faded },
  daysRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  dayBtn: {
    flex: 1, minWidth: 40, paddingVertical: Spacing.sm, borderRadius: Radius.sm,
    alignItems: 'center', backgroundColor: Colors.aged,
    borderWidth: 0.5, borderColor: Colors.border,
  },
  dayBtnActive: { backgroundColor: Colors.oak, borderColor: Colors.oak },
  dayText: { fontFamily: Fonts.heading, fontSize: 11, color: Colors.faded, letterSpacing: 0.5 },
  dayTextActive: { color: Colors.surface },
  presetsRow: { flexDirection: 'row', gap: Spacing.sm },
  presetBtn: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm,
    alignItems: 'center', backgroundColor: Colors.surface,
    borderWidth: 0.5, borderColor: Colors.border,
  },
  presetText: { fontFamily: Fonts.bodyItalic, fontSize: 13, color: Colors.sepia },
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