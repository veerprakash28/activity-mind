import Dexie, { type EntityTable } from 'dexie';
import { INITIAL_ACTIVITIES } from './activityBank';

// ── Types ──

export interface Activity {
  id?: number;
  name: string;
  description: string;
  category: string;
  steps: string; // JSON
  materials: string; // JSON
  estimated_cost: string;
  duration: string;
  difficulty: string;
  prep_time: string;
  min_employees: number;
  max_employees: number;
  indoor_outdoor: string;
  remote_compatible: number; // 0 or 1
  is_custom: number; // 0 or 1
  recurring_pattern: string | null;
}

export interface ActivityHistory {
  id?: number;
  activity_id: number;
  scheduled_date: string;
  completed: number;
  rating: number | null;
  feedback: string | null;
  notification_id: string | null;
  created_at: string;
}

export type TaskStatus = 'pending' | 'completed' | 'blocked' | 'review' | 'discussion';

export interface PersonalTask {
  id?: number;
  title: string;
  description: string | null;
  notes: string | null;
  reminder_time: string | null;
  status: TaskStatus;
  priority: 'Low' | 'Medium' | 'High';
  notification_id: string | null;
  created_at: string;
}

export interface ChatMessage {
  id?: number;
  text: string;
  sender: 'user' | 'ai';
  activities: string | null;
  engine: string | null;
  timestamp: string;
}

export interface Favorite {
  id?: number;
  activity_id: number;
  notes: string | null;
  saved_at: string;
}

export interface GenerationLog {
  id?: number;
  generated_at: string;
  activity_id: number;
}

// ── Database Class ──

class ActivityMindDB extends Dexie {
  activities!: EntityTable<Activity, 'id'>;
  favorites!: EntityTable<Favorite, 'id'>;
  activity_history!: EntityTable<ActivityHistory, 'id'>;
  generation_log!: EntityTable<GenerationLog, 'id'>;
  tasks!: EntityTable<PersonalTask, 'id'>;
  chat_history!: EntityTable<ChatMessage, 'id'>;

  constructor() {
    super('ActivityMindDB');
    this.version(1).stores({
      activities: '++id, name, category, is_custom, recurring_pattern',
      favorites: '++id, activity_id',
      activity_history: '++id, activity_id, scheduled_date, completed',
      generation_log: '++id, activity_id, generated_at',
      tasks: '++id, status, priority, created_at',
      chat_history: '++id, sender, timestamp',
    });
  }
}

export const db = new ActivityMindDB();

// ── Initialization / Seeding ──

let _initialized = false;

export const initDb = async () => {
  if (_initialized) return true;

  const builtInCount = await db.activities.where('is_custom').equals(0).count();

  if (builtInCount < INITIAL_ACTIVITIES.length) {
    const existingNames = new Set(
      (await db.activities.where('is_custom').equals(0).toArray()).map(a => a.name)
    );

    const toInsert = INITIAL_ACTIVITIES
      .filter(a => !existingNames.has(a.name))
      .map(a => ({ ...a, is_custom: 0, recurring_pattern: null }));

    if (toInsert.length > 0) {
      await db.activities.bulkAdd(toInsert);
    }
  }

  // Normalize categories to Title Case
  const allActivities = await db.activities.toArray();
  for (const activity of allActivities) {
    const normalized = activity.category
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    if (normalized !== activity.category) {
      await db.activities.update(activity.id!, { category: normalized });
    }
  }

  _initialized = true;
  return true;
};

// ── Helpers ──

export const normalizeDate = (date: Date) => {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};

// ── Data Access ──

export const getAllActivities = async (): Promise<Activity[]> => {
  return db.activities.toArray();
};

export const getUniqueCategories = async (): Promise<string[]> => {
  try {
    const activities = await db.activities.toArray();
    const cats = [...new Set(activities.map(a => a.category))].sort();
    return cats;
  } catch {
    return [];
  }
};

export const getRecentHistory = async (days = 30): Promise<ActivityHistory[]> => {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  return db.activity_history
    .where('scheduled_date')
    .aboveOrEqual(dateThreshold.toISOString())
    .reverse()
    .toArray();
};

export const getUpcomingActivity = async (): Promise<(ActivityHistory & Activity) | null> => {
  const now = normalizeDate(new Date());
  const historyItems = await db.activity_history
    .where('scheduled_date')
    .aboveOrEqual(now)
    .toArray();

  const incomplete = historyItems.filter(h => h.completed === 0)
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

  if (incomplete.length === 0) return null;

  const first = incomplete[0];
  const activity = await db.activities.get(first.activity_id);
  if (!activity) return null;

  return { ...activity, ...first, id: first.id } as ActivityHistory & Activity;
};

export const getActivityStats = async () => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const completed = await db.activity_history
    .where('scheduled_date')
    .aboveOrEqual(firstDayOfMonth)
    .filter(h => h.completed === 1)
    .count();

  return { completedThisMonth: completed };
};

export const saveHistory = async (activityId: number, scheduledDate: string): Promise<number> => {
  const normalized = normalizeDate(new Date(scheduledDate));
  const id = await db.activity_history.add({
    activity_id: activityId,
    scheduled_date: normalized,
    completed: 0,
    rating: null,
    feedback: null,
    notification_id: null,
    created_at: new Date().toISOString(),
  });
  return id as number;
};

export const removeScheduledActivity = async (historyId: number) => {
  await db.activity_history.delete(historyId);
};

export const markCompleted = async (historyId: number, rating: number, feedback: string) => {
  await db.activity_history.update(historyId, {
    completed: 1,
    rating,
    feedback,
  });
};

export const unmarkCompleted = async (historyId: number) => {
  await db.activity_history.update(historyId, {
    completed: 0,
    rating: null,
    feedback: null,
  });
};

export const toggleFavorite = async (activityId: number): Promise<boolean> => {
  const existing = await db.favorites.where('activity_id').equals(activityId).first();
  if (existing) {
    await db.favorites.delete(existing.id!);
    return false;
  } else {
    await db.favorites.add({
      activity_id: activityId,
      notes: null,
      saved_at: new Date().toISOString(),
    });
    return true;
  }
};

export const isFavorite = async (activityId: number): Promise<boolean> => {
  const existing = await db.favorites.where('activity_id').equals(activityId).first();
  return !!existing;
};

export const getFavorites = async (): Promise<(Favorite & Activity)[]> => {
  const favs = await db.favorites.reverse().sortBy('saved_at');
  const results: (Favorite & Activity)[] = [];
  for (const fav of favs) {
    const activity = await db.activities.get(fav.activity_id);
    if (activity) {
      results.push({ ...activity, ...fav } as Favorite & Activity);
    }
  }
  return results;
};

export const logGeneration = async (activityId: number) => {
  await db.generation_log.add({
    generated_at: new Date().toISOString(),
    activity_id: activityId,
  });
};

// ── Custom Activity CRUD ──

export const addCustomActivity = async (activity: Omit<Activity, 'id' | 'is_custom' | 'recurring_pattern'>): Promise<number> => {
  const id = await db.activities.add({
    ...activity,
    is_custom: 1,
    recurring_pattern: null,
  });
  return id as number;
};

export const updateActivity = async (id: number, updates: Partial<Activity>) => {
  await db.activities.update(id, updates);
};

export const deleteActivity = async (activityId: number) => {
  await db.favorites.where('activity_id').equals(activityId).delete();
  await db.activity_history.where('activity_id').equals(activityId).delete();
  await db.generation_log.where('activity_id').equals(activityId).delete();
  await db.activities.delete(activityId);
};

export const renameCategory = async (oldName: string, newName: string) => {
  const activities = await db.activities.where('category').equals(oldName).toArray();
  for (const a of activities) {
    await db.activities.update(a.id!, { category: newName });
  }
};

export const getMonthlyScheduledActivities = async (year: number, month: number): Promise<(ActivityHistory & Activity)[]> => {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  const startStr = normalizeDate(startOfMonth);
  const endStr = normalizeDate(endOfMonth);

  const historyItems = await db.activity_history
    .where('scheduled_date')
    .between(startStr, endStr, true, true)
    .toArray();

  const result: (ActivityHistory & Activity)[] = [];

  for (const h of historyItems) {
    const activity = await db.activities.get(h.activity_id);
    if (activity) {
      result.push({ ...activity, ...h, id: h.id } as ActivityHistory & Activity);
    }
  }

  // Handle recurring activities
  const recurringActivities = await db.activities
    .filter(a => a.recurring_pattern !== null && a.recurring_pattern !== undefined)
    .toArray();

  for (const activity of recurringActivities) {
    if (!activity.recurring_pattern) continue;

    if (activity.recurring_pattern.startsWith('weekly-')) {
      const targetDay = parseInt(activity.recurring_pattern.split('-')[1]);
      const tempDate = new Date(year, month, 1);

      while (tempDate.getMonth() === month) {
        if (tempDate.getDay() === targetDay) {
          const dateStr = normalizeDate(tempDate);
          const alreadyScheduled = historyItems.some(h =>
            h.activity_id === activity.id! &&
            h.scheduled_date.split('T')[0] === dateStr.split('T')[0]
          );

          if (!alreadyScheduled) {
            result.push({
              ...activity,
              id: -(activity.id!),
              activity_id: activity.id!,
              scheduled_date: dateStr,
              completed: 0,
              rating: null,
              feedback: null,
              notification_id: null,
              created_at: new Date().toISOString(),
            } as ActivityHistory & Activity);
          }
        }
        tempDate.setDate(tempDate.getDate() + 1);
      }
    }
  }

  return result.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
};

// ── Chat History ──

export const saveChatMessage = async (text: string, sender: 'user' | 'ai', activities: unknown[] | null = null, engine: string | null = null) => {
  await db.chat_history.add({
    text,
    sender,
    activities: activities ? JSON.stringify(activities) : null,
    engine,
    timestamp: new Date().toISOString(),
  });
};

export const getChatHistory = async (): Promise<ChatMessage[]> => {
  return db.chat_history.orderBy('timestamp').toArray();
};

export const clearChatHistory = async () => {
  await db.chat_history.clear();
};

// ── Tasks ──

export const getTasks = async (): Promise<PersonalTask[]> => {
  const tasks = await db.tasks.toArray();
  return tasks.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};

export const getPendingTasks = async (limit = 3): Promise<PersonalTask[]> => {
  const tasks = await db.tasks
    .filter(t => t.status !== 'completed')
    .toArray();
  return tasks
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, limit);
};

export const getPendingTasksCount = async (): Promise<number> => {
  return db.tasks.filter(t => t.status !== 'completed').count();
};

export const addTask = async (
  title: string,
  description: string | null,
  reminderTime: string | null,
  notes: string | null = null,
  status: TaskStatus = 'pending',
  priority: 'Low' | 'Medium' | 'High' = 'Medium'
): Promise<number> => {
  const id = await db.tasks.add({
    title,
    description,
    notes,
    reminder_time: reminderTime,
    status,
    priority,
    notification_id: null,
    created_at: new Date().toISOString(),
  });
  return id as number;
};

export const updateTask = async (id: number, updates: Partial<PersonalTask>) => {
  await db.tasks.update(id, updates);
};

export const deleteTask = async (id: number) => {
  await db.tasks.delete(id);
};
