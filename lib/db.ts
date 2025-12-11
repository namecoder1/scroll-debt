import * as SQLite from "expo-sqlite";
import { type SQLiteDatabase } from "expo-sqlite";

let db: SQLiteDatabase | null = null;

export const openDatabase = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("scroll_debt.db");
  return db;
};

export const initDB = async () => {
  const database = await openDatabase();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_it TEXT,
      category TEXT,
      category_it TEXT,
      is_custom INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS hobbies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_it TEXT,
      category TEXT,
      category_it TEXT,
      is_custom INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      duration INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      app_name TEXT, 
      context TEXT
    );

    CREATE TABLE IF NOT EXISTS contexts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_it TEXT,
      is_custom INTEGER DEFAULT 0
    );
  `);

  // Seed default apps if empty (check first)
  const existingApps = await database.getFirstAsync(
    "SELECT count(*) as count FROM apps"
  );
  // @ts-ignore
  if (existingApps && existingApps.count === 0) {
    const defaultApps = [
      {
        name: "TikTok",
        name_it: "TikTok",
        category: "Social",
        category_it: "Social",
      },
      {
        name: "Instagram",
        name_it: "Instagram",
        category: "Social",
        category_it: "Social",
      },
      {
        name: "Facebook",
        name_it: "Facebook",
        category: "Social",
        category_it: "Social",
      },
      {
        name: "Threads",
        name_it: "Threads",
        category: "Social",
        category_it: "Social",
      },
      {
        name: "X (Twitter)",
        name_it: "X (Twitter)",
        category: "Social",
        category_it: "Social",
      },
      {
        name: "Snapchat",
        name_it: "Snapchat",
        category: "Social",
        category_it: "Social",
      },
      {
        name: "Linkedin",
        name_it: "Linkedin",
        category: "Social",
        category_it: "Social",
      },
      {
        name: "Discord",
        name_it: "Discord",
        category: "Messaging",
        category_it: "Messaggistica",
      },
      {
        name: "WhatsApp",
        name_it: "WhatsApp",
        category: "Messaging",
        category_it: "Messaggistica",
      },
      {
        name: "Telegram",
        name_it: "Telegram",
        category: "Messaging",
        category_it: "Messaggistica",
      },
      {
        name: "YouTube",
        name_it: "YouTube",
        category: "Entertainment",
        category_it: "Intrattenimento",
      },
      {
        name: "Netflix",
        name_it: "Netflix",
        category: "Entertainment",
        category_it: "Intrattenimento",
      },
      {
        name: "Twitch",
        name_it: "Twitch",
        category: "Entertainment",
        category_it: "Intrattenimento",
      },
      {
        name: "Reddit",
        name_it: "Reddit",
        category: "Forums",
        category_it: "Forum",
      },
      {
        name: "Pinterest",
        name_it: "Pinterest",
        category: "Lifestyle",
        category_it: "Lifestyle",
      },
    ];
    for (const app of defaultApps) {
      await database.runAsync(
        "INSERT INTO apps (name, name_it, category, category_it, is_custom) VALUES (?, ?, ?, ?, 0)",
        app.name,
        app.name_it,
        app.category,
        app.category_it
      );
    }
  }

  // Seed default hobbies if empty
  const existingHobbies = await database.getFirstAsync(
    "SELECT count(*) as count FROM hobbies"
  );
  // @ts-ignore
  if (existingHobbies && existingHobbies.count === 0) {
    const defaultHobbies = [
      // Creative
      {
        name: "Drawing",
        name_it: "Disegno",
        category: "Creative",
        category_it: "Creativo",
      },
      {
        name: "Painting",
        name_it: "Pittura",
        category: "Creative",
        category_it: "Creativo",
      },
      {
        name: "Writing",
        name_it: "Scrittura",
        category: "Creative",
        category_it: "Creativo",
      },
      {
        name: "Photography",
        name_it: "Fotografia",
        category: "Creative",
        category_it: "Creativo",
      },
      {
        name: "Pottery",
        name_it: "Ceramica",
        category: "Creative",
        category_it: "Creativo",
      },
      {
        name: "Knitting",
        name_it: "Lavoro a maglia",
        category: "Creative",
        category_it: "Creativo",
      },
      {
        name: "Origami",
        name_it: "Origami",
        category: "Creative",
        category_it: "Creativo",
      },
      {
        name: "Calligraphy",
        name_it: "Calligrafia",
        category: "Creative",
        category_it: "Creativo",
      },
      {
        name: "DIY",
        name_it: "Fai da te",
        category: "Creative",
        category_it: "Creativo",
      },
      {
        name: "Model Building",
        name_it: "Modellismo",
        category: "Creative",
        category_it: "Creativo",
      },

      // Active
      {
        name: "Sports",
        name_it: "Sport",
        category: "Active",
        category_it: "Attivo",
      },
      {
        name: "Walking",
        name_it: "Camminata",
        category: "Active",
        category_it: "Attivo",
      },
      {
        name: "Running",
        name_it: "Corsa",
        category: "Active",
        category_it: "Attivo",
      },
      {
        name: "Cycling",
        name_it: "Ciclismo",
        category: "Active",
        category_it: "Attivo",
      },
      {
        name: "Swimming",
        name_it: "Nuoto",
        category: "Active",
        category_it: "Attivo",
      },
      {
        name: "Hiking",
        name_it: "Escursionismo",
        category: "Active",
        category_it: "Attivo",
      },
      {
        name: "Gym",
        name_it: "Palestra",
        category: "Active",
        category_it: "Attivo",
      },
      {
        name: "Dancing",
        name_it: "Ballo",
        category: "Active",
        category_it: "Attivo",
      },
      {
        name: "Yoga",
        name_it: "Yoga",
        category: "Active",
        category_it: "Attivo",
      },

      // Relaxing
      {
        name: "Reading",
        name_it: "Lettura",
        category: "Relaxing",
        category_it: "Rilassante",
      },
      {
        name: "Meditation",
        name_it: "Meditazione",
        category: "Relaxing",
        category_it: "Rilassante",
      },
      {
        name: "Gardening",
        name_it: "Giardinaggio",
        category: "Relaxing",
        category_it: "Rilassante",
      },
      {
        name: "Fishing",
        name_it: "Pesca",
        category: "Relaxing",
        category_it: "Rilassante",
      },
      {
        name: "Bird Watching",
        name_it: "Bird Watching",
        category: "Relaxing",
        category_it: "Rilassante",
      },
      {
        name: "Star Gazing",
        name_it: "Osservare le stelle",
        category: "Relaxing",
        category_it: "Rilassante",
      },

      // Skill / Learning
      {
        name: "Playing Instrument",
        name_it: "Suonare uno strumento",
        category: "Skill",
        category_it: "Abilità",
      },
      {
        name: "Cooking",
        name_it: "Cucina",
        category: "Skill",
        category_it: "Abilità",
      },
      {
        name: "Coding",
        name_it: "Programmazione",
        category: "Skill",
        category_it: "Abilità",
      },
      {
        name: "Singing",
        name_it: "Canto",
        category: "Skill",
        category_it: "Abilità",
      },
      {
        name: "Magic Tricks",
        name_it: "Giochi di magia",
        category: "Skill",
        category_it: "Abilità",
      },

      // Entertainment
      {
        name: "Gaming",
        name_it: "Videogiochi",
        category: "Entertainment",
        category_it: "Intrattenimento",
      },
      {
        name: "Board Games",
        name_it: "Giochi da tavolo",
        category: "Entertainment",
        category_it: "Intrattenimento",
      },
      {
        name: "Puzzles",
        name_it: "Puzzle",
        category: "Entertainment",
        category_it: "Intrattenimento",
      },
      {
        name: "Movies",
        name_it: "Film",
        category: "Entertainment",
        category_it: "Intrattenimento",
      },

      // Other
      {
        name: "Traveling",
        name_it: "Viaggiare",
        category: "Other",
        category_it: "Altro",
      },
      {
        name: "Collecting",
        name_it: "Collezionismo",
        category: "Other",
        category_it: "Altro",
      },
    ];
    for (const hobby of defaultHobbies) {
      await database.runAsync(
        "INSERT INTO hobbies (name, name_it, category, category_it, is_custom) VALUES (?, ?, ?, ?, 0)",
        hobby.name,
        hobby.name_it,
        hobby.category,
        hobby.category_it
      );
    }
  }

  // Seed default contexts if empty
  const existingContexts = await database.getFirstAsync(
    "SELECT count(*) as count FROM contexts"
  );
  // @ts-ignore
  if (existingContexts && existingContexts.count === 0) {
    const defaultContexts = [
      { name: "Wake up", name_it: "Risveglio" },
      { name: "Breakfast", name_it: "Colazione" },
      { name: "Morning", name_it: "Mattina" },
      { name: "Commuting", name_it: "Spostamento" },
      { name: "Work", name_it: "Lavoro" },
      { name: "Study", name_it: "Studio" },
      { name: "Lunch", name_it: "Pranzo" },
      { name: "Afternoon", name_it: "Pomeriggio" },
      { name: "Dinner", name_it: "Cena" },
      { name: "Evening", name_it: "Sera" },
      { name: "Relaxing", name_it: "Relax" },
      { name: "Bed", name_it: "Letto" },
      { name: "Toilet", name_it: "Bagno" },
      { name: "Bathroom", name_it: "Bagno" }, // Toilet/Bathroom overlap in IT, maybe 'Servizi'? using Bagno for both or distinguishing.
      { name: "Waiting", name_it: "Attesa" },
      { name: "Socializing", name_it: "Socializzando" },
      { name: "Gym", name_it: "Palestra" },
      { name: "Walk", name_it: "Passeggiata" },
      { name: "Public Transport", name_it: "Trasporti pubblici" },
      { name: "Car", name_it: "Auto" },
      { name: "Home", name_it: "Casa" },
      { name: "Outdoors", name_it: "Fuori" },
    ];
    for (const ctx of defaultContexts) {
      await database.runAsync(
        "INSERT INTO contexts (name, name_it, is_custom) VALUES (?, ?, 0)",
        ctx.name,
        ctx.name_it
      );
    }
  }
};

export const getSetting = async (key: string): Promise<string | null> => {
  const database = await openDatabase();
  const result: any = await database.getFirstAsync(
    "SELECT value FROM settings WHERE key = ?",
    key
  );
  return result ? result.value : null;
};

export const setSetting = async (key: string, value: string) => {
  const database = await openDatabase();
  await database.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    key,
    value
  );
};

export interface ScrollSession {
  id: number;
  duration: number;
  timestamp: number;
  app_name?: string;
  context?: string;
}

export const addSession = async (
  duration: number,
  appName?: string,
  context?: string
) => {
  const database = await openDatabase();
  const timestamp = Date.now();
  await database.runAsync(
    "INSERT INTO sessions (duration, timestamp, app_name, context) VALUES (?, ?, ?, ?)",
    duration,
    timestamp,
    appName ?? null,
    context ?? null
  );
};

export const deleteSession = async (id: number) => {
  const database = await openDatabase();
  await database.runAsync("DELETE FROM sessions WHERE id = ?", id);
};

export const updateSession = async (
  id: number,
  duration: number,
  appName?: string,
  context?: string
) => {
  const database = await openDatabase();
  await database.runAsync(
    "UPDATE sessions SET duration = ?, app_name = ?, context = ? WHERE id = ?",
    duration,
    appName ?? null,
    context ?? null,
    id
  );
};

export const getTodaySessions = async (): Promise<ScrollSession[]> => {
  const database = await openDatabase();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const timestamp = startOfDay.getTime();

  const rows: any[] = await database.getAllAsync(
    "SELECT * FROM sessions WHERE timestamp >= ? ORDER BY timestamp DESC",
    timestamp
  );
  return rows;
};

export const getTodayScrollMinutes = async (): Promise<number> => {
  const database = await openDatabase();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const timestamp = startOfDay.getTime();

  const result: any = await database.getFirstAsync(
    "SELECT SUM(duration) as total FROM sessions WHERE timestamp >= ?",
    timestamp
  );
  return result && result.total ? result.total : 0;
};

// Analytics Helpers

export const getWeeklyStats = async (): Promise<
  { date: string; minutes: number }[]
> => {
  const database = await openDatabase();
  const result: any[] = await database.getAllAsync(
    `
        SELECT 
            date(timestamp / 1000, 'unixepoch', 'localtime') as day,
            SUM(duration) as total
        FROM sessions 
        WHERE timestamp >= ?
        GROUP BY day
        ORDER BY day ASC
    `,
    Date.now() - 7 * 24 * 60 * 60 * 1000
  );

  // Fill in missing days
  const stats = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const found = result.find((r) => r.day === dateStr);
    stats.push({
      date: dateStr,
      minutes: found ? found.total : 0,
    });
  }
  return stats;
};

export const getAppUsageStats = async (): Promise<
  { name: string; minutes: number; percentage: number }[]
> => {
  const database = await openDatabase();
  // Get stats for TODAY
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const timestamp = startOfDay.getTime();

  const totalMinutes = await getTodayScrollMinutes();
  if (totalMinutes === 0) return [];

  const result: any[] = await database.getAllAsync(
    `
        SELECT 
            app_name as name,
            SUM(duration) as minutes
        FROM sessions 
        WHERE timestamp >= ? AND app_name IS NOT NULL
        GROUP BY app_name
        ORDER BY minutes DESC
    `,
    timestamp
  );

  return result.map((r) => ({
    ...r,
    percentage: Math.round((r.minutes / totalMinutes) * 100),
  }));
};

export const getContextStats = async (): Promise<
  { name: string; minutes: number; percentage: number }[]
> => {
  const database = await openDatabase();
  // Get stats for TODAY (or change to overall if preferred, keeping today for consistency)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const timestamp = startOfDay.getTime();

  const totalMinutes = await getTodayScrollMinutes();
  if (totalMinutes === 0) return [];

  const result: any[] = await database.getAllAsync(
    `
        SELECT 
            context as name,
            SUM(duration) as minutes
        FROM sessions 
        WHERE timestamp >= ? AND context IS NOT NULL
        GROUP BY context
        ORDER BY minutes DESC
    `,
    timestamp
  );

  return result.map((r) => ({
    ...r,
    percentage: Math.round((r.minutes / totalMinutes) * 100),
  }));
};

export const getAllTimeStats = async (): Promise<{
  totalMinutes: number;
  totalSessions: number;
  longestSession: number;
}> => {
  const database = await openDatabase();
  const result: any = await database.getFirstAsync(`
        SELECT 
            SUM(duration) as totalMinutes,
            COUNT(*) as totalSessions,
            MAX(duration) as longestSession
        FROM sessions
    `);

  return {
    totalMinutes: result?.totalMinutes || 0,
    totalSessions: result?.totalSessions || 0,
    longestSession: result?.longestSession || 0,
  };
};

export const getBusiestDayStats = async (): Promise<{
  dayName: string;
  minutes: number;
} | null> => {
  const database = await openDatabase();
  // Get stats grouped by day of week (0 = Sunday, 1 = Monday ...)
  // SQLite's strftime('%w', ...) returns 0-6
  const result: any = await database.getFirstAsync(`
        SELECT 
            strftime('%w', timestamp / 1000, 'unixepoch', 'localtime') as dayIndex,
            SUM(duration) as total
        FROM sessions
        GROUP BY dayIndex
        ORDER BY total DESC
        LIMIT 1
    `);

  if (!result) return null;

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return {
    dayName: days[parseInt(result.dayIndex)],
    minutes: result.total,
  };
};

export const getAverageDailyScroll = async (): Promise<number> => {
  const database = await openDatabase();
  // Count distinct days
  const result: any = await database.getFirstAsync(`
        SELECT 
            COUNT(DISTINCT date(timestamp / 1000, 'unixepoch', 'localtime')) as days,
            SUM(duration) as totalMinutes
        FROM sessions
    `);

  if (!result || !result.days || result.days === 0) return 0;
  return Math.round(result.totalMinutes / result.days);
};

export const getTopContext = async (): Promise<{
  name: string;
  count: number;
} | null> => {
  const database = await openDatabase();
  const result: any = await database.getFirstAsync(`
        SELECT context as name, COUNT(*) as count
        FROM sessions
        WHERE context IS NOT NULL
        GROUP BY context
        ORDER BY count DESC
        LIMIT 1
    `);

  return result ? { name: result.name, count: result.count } : null;
};

export const resetAllData = async () => {
  const database = await openDatabase();
  await database.execAsync(`
        DROP TABLE IF EXISTS sessions;
        DROP TABLE IF EXISTS settings;
        DROP TABLE IF EXISTS apps;
        DROP TABLE IF EXISTS hobbies;
        DROP TABLE IF EXISTS contexts;
    `);
  // Re-initialize to seed defaults again
  await initDB();
};
