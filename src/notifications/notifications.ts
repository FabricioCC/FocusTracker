import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getItems } from '../storage/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleReminder(
  id: string,
  title: string,
  body: string,
  hour: number,
  minute: number,
  days: number[]
): Promise<void> {
  await cancelReminder(id);

  for (const day of days) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${id}_${day}`,
      content: {
        title,
        body,
        sound: true,
        data: { reminderId: id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: day,
        hour,
        minute,
      },
    });
  }
}

export async function cancelReminder(id: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(n => n.identifier.startsWith(`${id}_`));
  await Promise.all(toCancel.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export async function scheduleAbandonmentCheck(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

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
          body: `It's been ${daysSince} days since you touched "${item.title}". Continue?`,
          sound: true,
          data: { itemId: item.id },
        },
        trigger: null,
      });
    }
  }
}