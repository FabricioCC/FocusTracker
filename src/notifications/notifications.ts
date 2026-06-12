import * as Notifications from 'expo-notifications';
import { getItems } from '../storage/storage';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
  name: 'Focus Reminders',
  importance: Notifications.AndroidImportance.MAX,
  sound: 'default',
  enableVibrate: true,
  vibrationPattern: [0, 500, 200, 500],
  lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  bypassDnd: true,
});
  }

  const { status } = await Notifications.requestPermissionsAsync({
    android: {
      allowAlert: true,
      allowSound: true,
      allowBadge: true,
    },
  } as any);

  return status === 'granted';
}

export async function scheduleReminder(
  id: string,
  title: string,
  body: string,
  hour: number,
  minute: number,
  days: number[],
  itemId: string
): Promise<void> {
  await cancelReminder(id);

  for (const day of days) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${id}_${day}`,
      content: {
        title,
        body,
        sound: 'default',
        data: { reminderId: id, itemId },
        priority: 'max',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: day,
        hour,
        minute,
        second: 0,
        channelId: 'reminders',
      },
    });
  }
}

export async function cancelReminder(id: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(n => n.identifier.startsWith(`${id}_`));
  await Promise.all(toCancel.map(n =>
    Notifications.cancelScheduledNotificationAsync(n.identifier)
  ));
}

export async function scheduleAbandonmentCheck(): Promise<void> {
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
          sound: true,
          data: { itemId: item.id },
        },
        trigger: null,
      });
    }
  }
}