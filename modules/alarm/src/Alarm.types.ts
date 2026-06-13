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