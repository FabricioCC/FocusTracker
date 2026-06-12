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

// unidade de medida por categoria
export const CATEGORY_UNIT: Record<Category, string> = {
  book: 'pages',
  movie: 'minutes',
  series: 'episodes',
  anime: 'episodes',
  game: 'hours',
  course: 'hours',
  tech_book: 'pages',
};

// label do campo total na tela de cadastro
export const CATEGORY_TOTAL_LABEL: Record<Category, string> = {
  book: 'Total pages',
  movie: 'Duration (minutes)',
  series: 'Total episodes',
  anime: 'Total episodes',
  game: 'Estimated hours',
  course: 'Total hours',
  tech_book: 'Total pages',
};

export interface ProgressLog {
  current: number;
  description: string;
  date: string;
}

export interface Item {
  id: string;
  title: string;
  category: Category;
  status: Status;
  total: number;        // total de páginas/horas/episódios
  current: number;      // onde está agora
  progress: number;     // percentual calculado (0-100)
  note: string;
  createdAt: string;
  updatedAt: string;
  logs: ProgressLog[];
}

export interface Reminder {
  id: string;
  itemId: string;       // vinculado a um item específico
  itemTitle: string;    // pra mostrar na lista sem buscar
  hour: number;
  minute: number;
  days: number[];
  enabled: boolean;
}