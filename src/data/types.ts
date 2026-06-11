export const CATEGORIES = {
  book: 'book',
  movie: 'movie',
  series: 'series',
  anime: 'anime',
  game: 'game',
  course: 'course',
  tech_book: 'tech book',
} as const;

export const STATUS = {
  backlog: 'backlog',
  active: 'active',
  paused: 'paused',
  completed: 'completed',
} as const;

export type Category = keyof typeof CATEGORIES;
export type Status = keyof typeof STATUS;

export interface ProgressLog {
  description: string;
  percentage: number;
  date: string;
}

export interface Item {
  id: string;
  title: string;
  category: Category;
  status: Status;
  progress: number;
  note: string;
  createdAt: string;
  updatedAt: string;
  logs: ProgressLog[];
}

export interface Reminder {
  id: string;
  itemId: string;
  hour: number;
  minute: number;
  days: number[];
  enabled: boolean;
}