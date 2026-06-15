import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { getItems } from '../storage/storage';

const ABANDONMENT_TASK = 'check-abandonment';

TaskManager.defineTask(ABANDONMENT_TASK, async () => {
  try {
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
            body: `${daysSince} days without progress on "${item.title}". Don't abandon your quest!`,
            sound: 'default',
            data: { itemId: item.id },
          },
          trigger: null,
        });
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundTask(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(ABANDONMENT_TASK);
  if (isRegistered) return;

  await BackgroundFetch.registerTaskAsync(ABANDONMENT_TASK, {
    minimumInterval: 60 * 60 * 24, // uma vez por dia
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

export async function unregisterBackgroundTask(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(ABANDONMENT_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(ABANDONMENT_TASK);
  }
}