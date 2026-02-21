import * as SQLite from 'expo-sqlite';
import { INITIAL_ACTIVITIES } from './activityBank';

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
      created_at TEXT NOT NULL,
      FOREIGN KEY (activity_id) REFERENCES activities(id)
    );

    CREATE TABLE IF NOT EXISTS generation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      generated_at TEXT NOT NULL,
      activity_id INTEGER NOT NULL
    );
  `);

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

    return true;
};

// --- DATA ACCESS METHODS ---

// Get all activities (respecting some basic filters if needed)
export const getAllActivities = async () => {
    const db = await getDb();
    return await db.getAllAsync<Activity>(`SELECT * FROM activities`);
};

export const getUniqueCategories = async () => {
    const db = await getDb();
    const result = await db.getAllAsync<{ category: string }>(`SELECT DISTINCT category FROM activities ORDER BY category ASC`);
    return result.map(r => r.category);
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
    const now = new Date().toISOString();
    return await db.getFirstAsync<ActivityHistory & Activity>(
        `SELECT h.*, a.name, a.category, a.duration FROM activity_history h JOIN activities a ON h.activity_id = a.id WHERE h.scheduled_date >= ? AND h.completed = 0 ORDER BY h.scheduled_date ASC LIMIT 1`,
        [now]
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
    const result = await db.runAsync(
        `INSERT INTO activity_history (activity_id, scheduled_date, created_at) VALUES (?, ?, ?)`,
        [activityId, scheduledDate, new Date().toISOString()]
    );
    return result.lastInsertRowId;
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

export const deleteActivity = async (activityId: number) => {
    const db = await getDb();
    // Also clean up related records
    await db.runAsync(`DELETE FROM favorites WHERE activity_id = ?`, [activityId]);
    await db.runAsync(`DELETE FROM activity_history WHERE activity_id = ?`, [activityId]);
    await db.runAsync(`DELETE FROM generation_log WHERE activity_id = ?`, [activityId]);
    await db.runAsync(`DELETE FROM activities WHERE id = ?`, [activityId]);
};
