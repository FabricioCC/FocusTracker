import AsyncStorage from '@react-native-async-storage/async-storage';
import { Item, Reminder } from '../data/types';

const ITEMS_KEY = '@focustracker:items';
const REMINDERS_KEY = '@focustracker:reminders';

// ITEMS
export async function getItems(): Promise<Item[]> {
  const json = await AsyncStorage.getItem(ITEMS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveItems(items: Item[]): Promise<void> {
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export async function addItem(
  data: Pick<Item, 'title' | 'category' | 'note' | 'total'>
): Promise<Item> {
  const items = await getItems();
  const newItem: Item = {
    id: Date.now().toString(),
    title: data.title,
    category: data.category,
    status: 'backlog',
    total: data.total,
    current: 0,
    progress: 0,
    note: data.note ?? '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    logs: [],
  };
  await saveItems([...items, newItem]);
  return newItem;
}

export async function updateItem(id: string, data: Partial<Item>): Promise<void> {
  const items = await getItems();
  const updated = items.map(item =>
    item.id === id
      ? { ...item, ...data, updatedAt: new Date().toISOString() }
      : item
  );
  await saveItems(updated);
}

export async function logProgress(
  id: string,
  current: number,
  description: string
): Promise<void> {
  const items = await getItems();
  const updated = items.map(item => {
    if (item.id !== id) return item;
    const progress = item.total > 0
      ? Math.min(100, Math.round((current / item.total) * 100))
      : 0;
    return {
      ...item,
      current,
      progress,
      updatedAt: new Date().toISOString(),
      logs: [
        ...item.logs,
        { current, description, date: new Date().toISOString() },
      ],
    };
  });
  await saveItems(updated);
}

// REMINDERS
export async function getReminders(): Promise<Reminder[]> {
  const json = await AsyncStorage.getItem(REMINDERS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveReminders(reminders: Reminder[]): Promise<void> {
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}