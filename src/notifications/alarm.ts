import { requireNativeModule } from 'expo-modules-core';
import * as Notifications from 'expo-notifications';
import { getItems } from '../storage/storage';
import { CATEGORY_UNIT } from '../data/types';

const AlarmNative = requireNativeModule('Alarm');

export async function requestAlarmPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function setAlarm(options: {
  id: string;
  itemId: string;
  itemTitle: string;
  itemProgress: number;
  itemCurrent: number;
  itemTotal: number;
  itemUnit: string;
  hour: number;
  minute: number;
  days: number[];
}): Promise<void> {
  await AlarmNative.setAlarm(options);
}

export async function cancelAlarm(id: string): Promise<void> {
  await AlarmNative.cancelAlarm(id);
}

export async function checkAbandonedItems(): Promise<void> {
  const items = await getItems();
  const active = items.filter(i => i.status === 'active' || i.status === 'paused');

  for (const item of active) {
    const daysSince = Math.floor(
      (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince >= 5) {
      await Notifications.scheduleNotificationAsync({
        identifier: `abandon_${item.id}`,
        content: {
          title: '⚔️ Your quest awaits',
          body: `${daysSince} days without progress on "${item.title}". Continue?`,
          data: { itemId: item.id },
        },
        trigger: null,
      });
    }
  }
}