import * as SQLite from 'expo-sqlite';
import { INITIAL_ACTIVITIES } from './activityBank';
import { NotificationService } from '../utils/NotificationService';

const DB_NAME = 'activitymind.db';

export interface Activity {
    id: number;
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
}

export interface ActivityHistory {
    id: number;
    activity_id: number;
    scheduled_date: string; // ISO String
    completed: number; // 0 or 1
    rating: number | null;
    feedback: string | null;
    notification_id: string | null;
    created_at: string;
}

export interface Favorite {
    id: number;
    activity_id: number;
    notes: string | null;
    saved_at: string;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDb = async () => {
    if (dbInstance) return dbInstance;
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    return dbInstance;
};

export const initDb = async () => {
    const db = await getDb();

    // Create tables
    await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      steps TEXT NOT NULL,
      materials TEXT NOT NULL,
      estimated_cost TEXT NOT NULL,
      duration TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      prep_time TEXT NOT NULL,
      min_employees INTEGER NOT NULL,
      max_employees INTEGER NOT NULL,
      indoor_outdoor TEXT NOT NULL,
      remote_compatible INTEGER NOT NULL,
      is_custom INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      notes TEXT,
      saved_at TEXT NOT NULL,
      FOREIGN KEY (activity_id) REFERENCES activities(id)
    );

    CREATE TABLE IF NOT EXISTS activity_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      scheduled_date TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      rating INTEGER,
      feedback TEXT,
      notification_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (activity_id) REFERENCES activities(id)
    );

    CREATE TABLE IF NOT EXISTS generation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      generated_at TEXT NOT NULL,
      activity_id INTEGER NOT NULL
    );
  `);

    // Migration logic for existing tables
    try {
        const tableInfo = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(activities)`);
        const hasIsCustom = tableInfo.some(col => col.name === 'is_custom');
        if (!hasIsCustom) {
            console.log("Migration: Adding is_custom column to activities table...");
            await db.execAsync(`ALTER TABLE activities ADD COLUMN is_custom INTEGER DEFAULT 0;`);
        }

        // Migration: Add notification_id to activity_history
        const historyInfo = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(activity_history)`);
        const hasNotificationId = historyInfo.some(col => col.name === 'notification_id');
        if (!hasNotificationId) {
            console.log("Migration: Adding notification_id column to activity_history table...");
            await db.execAsync(`ALTER TABLE activity_history ADD COLUMN notification_id TEXT;`);
        }
    } catch (e) {
        console.error("Migration failed", e);
    }

    // Check if we need to seed data (seed if empty or bank has grown)
    const result = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM activities WHERE is_custom = 0`);
    const builtInCount = result?.count || 0;

    if (builtInCount < INITIAL_ACTIVITIES.length) {
        console.log(`Seeding activities... (${builtInCount} existing, ${INITIAL_ACTIVITIES.length} in bank)`);

        if (builtInCount === 0) {
            // Fresh install — seed everything
            for (const activity of INITIAL_ACTIVITIES) {
                await db.runAsync(
                    `INSERT INTO activities (
                        name, description, category, steps, materials, estimated_cost, duration, difficulty, prep_time, min_employees, max_employees, indoor_outdoor, remote_compatible, is_custom
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        activity.name, activity.description, activity.category, activity.steps,
                        activity.materials, activity.estimated_cost, activity.duration, activity.difficulty,
                        activity.prep_time, activity.min_employees, activity.max_employees,
                        activity.indoor_outdoor, activity.remote_compatible, 0
                    ]
                );
            }
        } else {
            // Existing install with fewer activities — add only new ones
            const existingNames = await db.getAllAsync<{ name: string }>(`SELECT name FROM activities WHERE is_custom = 0`);
            const existingNameSet = new Set(existingNames.map(e => e.name));

            for (const activity of INITIAL_ACTIVITIES) {
                if (!existingNameSet.has(activity.name)) {
                    await db.runAsync(
                        `INSERT INTO activities (
                            name, description, category, steps, materials, estimated_cost, duration, difficulty, prep_time, min_employees, max_employees, indoor_outdoor, remote_compatible, is_custom
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            activity.name, activity.description, activity.category, activity.steps,
                            activity.materials, activity.estimated_cost, activity.duration, activity.difficulty,
                            activity.prep_time, activity.min_employees, activity.max_employees,
                            activity.indoor_outdoor, activity.remote_compatible, 0
                        ]
                    );
                }
            }
        }
        console.log('Seeding complete.');
    }

    // Cleanup: Normalize all categories to Title Case to prevent duplicates (collision fix)
    // This handles existing data that might have different casing
    const allActivities = await db.getAllAsync<{ id: number; category: string }>(`SELECT id, category FROM activities`);
    for (const activity of allActivities) {
        const normalized = activity.category.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        if (normalized !== activity.category) {
            await db.runAsync(`UPDATE activities SET category = ? WHERE id = ?`, [normalized, activity.id]);
        }
    }

    return true;
};

// --- HELPERS ---

export const normalizeDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0); // Set to noon to avoid day shifting
    return d.toISOString();
};

// --- DATA ACCESS METHODS ---

// Get all activities (respecting some basic filters if needed)
export const getAllActivities = async () => {
    const db = await getDb();
    return await db.getAllAsync<Activity>(`SELECT * FROM activities`);
};

export const getUniqueCategories = async () => {
    try {
        const db = await getDb();
        const result = await db.getAllAsync<{ category: string }>(`SELECT DISTINCT category FROM activities ORDER BY category ASC`);
        return result.map(r => r.category);
    } catch (e) {
        console.log("Categories not ready yet (table might be missing)");
        return [];
    }
};

// Get recent history (for 30 day checks and dashboard)
export const getRecentHistory = async (days = 30) => {
    const db = await getDb();
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return await db.getAllAsync<ActivityHistory>(
        `SELECT * FROM activity_history WHERE scheduled_date >= ? ORDER BY scheduled_date DESC`,
        [dateThreshold.toISOString()]
    );
};

export const getUpcomingActivity = async () => {
    const db = await getDb();
    const now = new Date();
    // Use the start of today at noon as the baseline
    const todayNoon = normalizeDate(now);

    return await db.getFirstAsync<ActivityHistory & Activity>(
        `SELECT h.*, a.name, a.category, a.duration FROM activity_history h JOIN activities a ON h.activity_id = a.id WHERE h.scheduled_date >= ? AND h.completed = 0 ORDER BY h.scheduled_date ASC LIMIT 1`,
        [todayNoon]
    );
};

export const getActivityStats = async () => {
    const db = await getDb();
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const monthResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM activity_history WHERE scheduled_date >= ? AND completed = 1`,
        [firstDayOfMonth]
    );

    return {
        completedThisMonth: monthResult?.count || 0
    };
};

export const saveHistory = async (activityId: number, scheduledDate: string) => {
    const db = await getDb();
    const normalized = normalizeDate(new Date(scheduledDate));

    // Fetch activity name for the notification
    const activity = await db.getFirstAsync<{ name: string }>(`SELECT name FROM activities WHERE id = ?`, [activityId]);
    const activityName = activity?.name || 'Upcoming Activity';

    const result = await db.runAsync(
        `INSERT INTO activity_history (activity_id, scheduled_date, created_at) VALUES (?, ?, ?)`,
        [activityId, normalized, new Date().toISOString()]
    );

    const historyId = result.lastInsertRowId;

    // Schedule notification
    const notificationId = await NotificationService.scheduleActivityReminder(historyId, activityName, normalized);

    if (notificationId) {
        await db.runAsync(`UPDATE activity_history SET notification_id = ? WHERE id = ?`, [notificationId, historyId]);
    }

    return historyId;
};

export const removeScheduledActivity = async (historyId: number) => {
    const db = await getDb();

    // Fetch notification ID to cancel it
    const record = await db.getFirstAsync<{ notification_id: string }>(
        `SELECT notification_id FROM activity_history WHERE id = ?`,
        [historyId]
    );

    if (record?.notification_id) {
        await NotificationService.cancelActivityReminder(record.notification_id);
    }

    await db.runAsync(`DELETE FROM activity_history WHERE id = ?`, [historyId]);
};

export const markCompleted = async (historyId: number, rating: number, feedback: string) => {
    const db = await getDb();
    await db.runAsync(
        `UPDATE activity_history SET completed = 1, rating = ?, feedback = ? WHERE id = ?`,
        [rating, feedback, historyId]
    );
};

export const unmarkCompleted = async (historyId: number) => {
    const db = await getDb();
    await db.runAsync(
        `UPDATE activity_history SET completed = 0, rating = NULL, feedback = NULL WHERE id = ?`,
        [historyId]
    );
};

export const toggleFavorite = async (activityId: number) => {
    const db = await getDb();
    const existing = await db.getFirstAsync(`SELECT id FROM favorites WHERE activity_id = ?`, [activityId]);

    if (existing) {
        await db.runAsync(`DELETE FROM favorites WHERE activity_id = ?`, [activityId]);
        return false; // Not favorite anymore
    } else {
        await db.runAsync(
            `INSERT INTO favorites (activity_id, saved_at) VALUES (?, ?)`,
            [activityId, new Date().toISOString()]
        );
        return true; // Is favorite
    }
};

export const isFavorite = async (activityId: number) => {
    const db = await getDb();
    const existing = await db.getFirstAsync(`SELECT id FROM favorites WHERE activity_id = ?`, [activityId]);
    return !!existing;
};

export const getFavorites = async () => {
    const db = await getDb();
    return await db.getAllAsync<Favorite & Activity>(
        `SELECT f.*, a.* FROM favorites f JOIN activities a ON f.activity_id = a.id ORDER BY f.saved_at DESC`
    );
};

export const logGeneration = async (activityId: number) => {
    const db = await getDb();
    await db.runAsync(
        `INSERT INTO generation_log (generated_at, activity_id) VALUES (?, ?)`,
        [new Date().toISOString(), activityId]
    );
};

export const getGenerationCountThisMonth = async () => {
    const db = await getDb();
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM generation_log WHERE generated_at >= ?`,
        [firstDayOfMonth]
    );
    return result?.count || 0;
};

// --- CUSTOM ACTIVITY CRUD ---

export const addCustomActivity = async (activity: {
    name: string;
    description: string;
    category: string;
    steps: string;
    materials: string;
    estimated_cost: string;
    duration: string;
    difficulty: string;
    prep_time: string;
    min_employees: number;
    max_employees: number;
    indoor_outdoor: string;
    remote_compatible: number;
}) => {
    const db = await getDb();
    const result = await db.runAsync(
        `INSERT INTO activities (
            name, description, category, steps, materials, estimated_cost, duration, difficulty, prep_time, min_employees, max_employees, indoor_outdoor, remote_compatible, is_custom
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
            activity.name,
            activity.description,
            activity.category,
            activity.steps,
            activity.materials,
            activity.estimated_cost,
            activity.duration,
            activity.difficulty,
            activity.prep_time,
            activity.min_employees,
            activity.max_employees,
            activity.indoor_outdoor,
            activity.remote_compatible,
        ]
    );
    return result.lastInsertRowId;
};

export const updateActivity = async (id: number, activity: Partial<Activity>) => {
    const db = await getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (activity.name) { fields.push('name = ?'); values.push(activity.name); }
    if (activity.description) { fields.push('description = ?'); values.push(activity.description); }
    if (activity.category) { fields.push('category = ?'); values.push(activity.category); }
    if (activity.steps) { fields.push('steps = ?'); values.push(activity.steps); }
    if (activity.materials) { fields.push('materials = ?'); values.push(activity.materials); }
    if (activity.estimated_cost) { fields.push('estimated_cost = ?'); values.push(activity.estimated_cost); }
    if (activity.duration) { fields.push('duration = ?'); values.push(activity.duration); }
    if (activity.difficulty) { fields.push('difficulty = ?'); values.push(activity.difficulty); }
    if (activity.prep_time) { fields.push('prep_time = ?'); values.push(activity.prep_time); }
    if (activity.min_employees !== undefined) { fields.push('min_employees = ?'); values.push(activity.min_employees); }
    if (activity.max_employees !== undefined) { fields.push('max_employees = ?'); values.push(activity.max_employees); }
    if (activity.indoor_outdoor) { fields.push('indoor_outdoor = ?'); values.push(activity.indoor_outdoor); }
    if (activity.remote_compatible !== undefined) { fields.push('remote_compatible = ?'); values.push(activity.remote_compatible); }

    if (fields.length === 0) return;

    values.push(id);
    await db.runAsync(
        `UPDATE activities SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
};

export const deleteActivity = async (activityId: number) => {
    const db = await getDb();

    // Clean up notifications for this activity before deleting history
    const historyItems = await db.getAllAsync<{ notification_id: string }>(
        `SELECT notification_id FROM activity_history WHERE activity_id = ? AND notification_id IS NOT NULL`,
        [activityId]
    );

    for (const item of historyItems) {
        await NotificationService.cancelActivityReminder(item.notification_id);
    }

    // Also clean up related records
    await db.runAsync(`DELETE FROM favorites WHERE activity_id = ?`, [activityId]);
    await db.runAsync(`DELETE FROM activity_history WHERE activity_id = ?`, [activityId]);
    await db.runAsync(`DELETE FROM generation_log WHERE activity_id = ?`, [activityId]);
    await db.runAsync(`DELETE FROM activities WHERE id = ?`, [activityId]);
};

export const renameCategory = async (oldName: string, newName: string) => {
    const db = await getDb();
    await db.runAsync(`UPDATE activities SET category = ? WHERE category = ?`, [newName, oldName]);
};
