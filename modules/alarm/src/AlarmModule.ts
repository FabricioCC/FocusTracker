import { requireNativeModule } from 'expo-modules-core';

const AlarmModule = requireNativeModule('Alarm');

export interface AlarmOptions {
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
}

export async function setAlarmNative(options: AlarmOptions): Promise<void> {
  return AlarmModule.setAlarm(options);
}

export async function cancelAlarmNative(id: string): Promise<void> {
  return AlarmModule.cancelAlarm(id);
}