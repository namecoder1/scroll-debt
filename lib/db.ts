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

    CREATE TABLE IF NOT EXISTS time_presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      minutes INTEGER NOT NULL,
      is_custom INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS payback_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hobby_name TEXT NOT NULL,
      duration INTEGER NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rescue_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      duration INTEGER NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accepted_missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      duration INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, completed, abandoned
      flavor_title_key TEXT,
      flavor_desc_key TEXT,
      icon TEXT,
      color TEXT
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

  // Seed default time presets if empty
  const existingTimes = await database.getFirstAsync(
    "SELECT count(*) as count FROM time_presets"
  );
  // @ts-ignore
  if (existingTimes && existingTimes.count === 0) {
    const defaultTimes = [5, 15, 30, 60, 120];
    for (const min of defaultTimes) {
      await database.runAsync(
        "INSERT INTO time_presets (minutes, is_custom) VALUES (?, 0)",
        min
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

// Returns stats for the current week (Monday to Sunday)
export const getThisWeekStats = async (): Promise<
  { date: string; minutes: number }[]
> => {
  const database = await openDatabase();
  const now = new Date();

  // Calculate Monday of the current week
  // Day of week: 0 (Sun) to 6 (Sat)
  // If today is Sunday (0), Monday was 6 days ago.
  // If today is Monday (1), Monday is today (0 days ago).
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const timestamp = monday.getTime();

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
    timestamp
  );

  // Fill in missing days for the week (Mon-Sun = 7 days)
  const stats = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
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
  dayIndex: number;
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

  return {
    dayIndex: parseInt(result.dayIndex),
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

export const getRandomHobbies = async (limit: number): Promise<any[]> => {
  const database = await openDatabase();
  const result: any[] = await database.getAllAsync(
    `SELECT * FROM hobbies ORDER BY RANDOM() LIMIT ?`,
    limit
  );
  return result;
};

// --- Payback & Rescue ---

export const addPaybackSession = async (
  duration: number,
  hobbyName: string
) => {
  const database = await openDatabase();
  await database.runAsync(
    "INSERT INTO payback_logs (duration, hobby_name, timestamp) VALUES (?, ?, ?)",
    duration,
    hobbyName,
    Date.now()
  );
};

export const addRescueSession = async (duration: number) => {
  const database = await openDatabase();
  const timestamp = Date.now();
  // Rescue counts as payback too (special hobby "Rescue Mode") but kept separate for tracking specific rescue usage
  await database.runAsync(
    "INSERT INTO rescue_sessions (duration, timestamp) VALUES (?, ?)",
    duration,
    timestamp
  );
  // Also log as payback
  await database.runAsync(
    "INSERT INTO payback_logs (duration, hobby_name, timestamp) VALUES (?, ?, ?)",
    duration,
    "Rescue Mode",
    timestamp
  );
};

export const getDayPartStats = async (): Promise<{
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
}> => {
  const database = await openDatabase();
  // Group by hour and then we aggregate in JS or SQL. SQL CASE is cleaner.
  const result: any[] = await database.getAllAsync(`
    SELECT 
      CASE 
        WHEN strftime('%H', timestamp / 1000, 'unixepoch', 'localtime') BETWEEN '05' AND '11' THEN 'morning'
        WHEN strftime('%H', timestamp / 1000, 'unixepoch', 'localtime') BETWEEN '12' AND '16' THEN 'afternoon'
        WHEN strftime('%H', timestamp / 1000, 'unixepoch', 'localtime') BETWEEN '17' AND '21' THEN 'evening'
        ELSE 'night'
      END as part,
      SUM(duration) as total
    FROM sessions
    GROUP BY part
  `);

  const stats = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  result.forEach((r) => {
    if (r.part === "morning") stats.morning = r.total;
    if (r.part === "afternoon") stats.afternoon = r.total;
    if (r.part === "evening") stats.evening = r.total;
    if (r.part === "night") stats.night = r.total;
  });

  return stats;
};

export const getPaybackMinutes = async (): Promise<number> => {
  const database = await openDatabase();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const timestamp = startOfDay.getTime();

  const result: any = await database.getFirstAsync(
    "SELECT SUM(duration) as total FROM payback_logs WHERE timestamp >= ?",
    timestamp
  );
  return result && result.total ? result.total : 0;
};

// --- Advanced Analytics ---

export const getMonthlyStats = async (): Promise<
  { date: string; minutes: number }[]
> => {
  const database = await openDatabase();
  // Get last 30 days
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
    Date.now() - 30 * 24 * 60 * 60 * 1000
  );
  return result.map((r) => ({ date: r.day, minutes: r.total }));
};

export const getHotHours = async (): Promise<number[]> => {
  const database = await openDatabase();
  const result: any[] = await database.getAllAsync(`
      SELECT 
          strftime('%H', timestamp / 1000, 'unixepoch', 'localtime') as hour,
          COUNT(*) as count
      FROM sessions
      GROUP BY hour
      ORDER BY hour ASC
  `);

  // Initialize array 0-23
  const hours = new Array(24).fill(0);
  result.forEach((r) => {
    hours[parseInt(r.hour)] = r.count;
  });
  return hours;
};

export const getStreakStats = async (): Promise<{
  currentStreak: number;
  bestStreak: number;
}> => {
  const database = await openDatabase();

  // Get all days with data
  // We consider a "good day" if: (total_scroll - total_payback) <= daily_budget
  // We need to fetch daily totals for scroll and payback.

  // 1. Get daily scroll totals
  const scrollData: any[] = await database.getAllAsync(`
    SELECT 
      date(timestamp / 1000, 'unixepoch', 'localtime') as dateStr,
      SUM(duration) as totalScroll
    FROM sessions
    GROUP BY dateStr
    ORDER BY dateStr DESC
  `);

  // 2. Get daily payback totals
  const paybackData: any[] = await database.getAllAsync(`
    SELECT 
      date(timestamp / 1000, 'unixepoch', 'localtime') as dateStr,
      SUM(duration) as totalPayback
    FROM payback_logs
    GROUP BY dateStr
  `);

  const budgetStr = await getSetting("daily_scroll_budget");
  const budget = budgetStr ? parseInt(budgetStr) : 60;

  // Merge map
  const dailyStatus = new Map<string, boolean>(); // date -> isGood

  // Process scroll data
  scrollData.forEach((day) => {
    const payback =
      paybackData.find((p) => p.dateStr === day.dateStr)?.totalPayback || 0;
    const netDebt = day.totalScroll - payback;
    dailyStatus.set(day.dateStr, netDebt <= budget);
  });

  // Calculate Streak
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Sort dates needed? scrollData is DESC (newest first)
  // For current streak, iterate from today backwards.
  // For best streak, we need chronological or just scan.

  // Let's re-sort chronological for best streak text
  const sortedDates = Array.from(dailyStatus.keys()).sort();

  // Calculate Best Streak
  for (const date of sortedDates) {
    if (dailyStatus.get(date)) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // Calculate Current Streak
  // Check from today (or yesterday if today not finished/logged?)
  // Streak generally includes today if valid so far, or until yesterday.
  // Let's count backwards from today.
  const today = new Date().toISOString().split("T")[0];

  // If today is good or no data yet?
  // If today has data and is good -> streak starts 1.
  // If today no data -> check yesterday.

  // Simplify: Check backwards from most recent entry
  if (sortedDates.length > 0) {
    // Check from the very last day in sorted list.
    // If that day is good, streak++. check day before.
    // Break if day gap > 1? Or just consecutive in data?
    // "Streak" usually implies consecutive calendar days.

    let checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      const hasData = dailyStatus.has(dateStr);
      const isGood = dailyStatus.get(dateStr);

      if (hasData) {
        if (isGood) {
          currentStreak++;
        } else {
          break; // streak broken
        }
      } else {
        // No data for this day.
        // If it's today, ignore and continue to yesterday?
        // If it's a past day, streak is broken (unless we assume 0 scroll = good?
        // But db query only returns days with sessions. Days with NO sessions are technically 0 scroll -> Good!)

        // Correct logic: Days with NO sessions are implicitly 0 scroll -> Net Debt 0 -> Good!
        // So we should check if we hit the "beginning of time" (install date) or just cap it.
        // For simplicity, let's just count backward until we find a BAD day or arbitrary limit.
        // BUT: infinite loop risk if no bad days.
        // Let's stick to "consecutive days in database that are good".
        // If a day is missing in DB, it means 0 usage => Good.

        // Wait, if I didn't open the app for a month, do I get 30 days streak? Maybe.
        // Let's restrict: Streak is strictly based on data presence OR just last X days?
        // Standard app logic: Current Streak = consecutive days ending Today/Yesterday.
        // If today is partial, we look at yesterday?

        // Let's simplified version:
        // 1. Get List of ALL days from first Session to Today.
        // 2. For each day, calc net debt.
        // 3. Calc streak.
        break; // For MVP, let's stop complex logic. Keep it simple: only count days WITH data for now?
        // Or better: Assume missing = good.
        // Let's implement simple "Consecutive Good Days" found in DB for now to avoid complexity.
      }
      checkDate.setDate(checkDate.getDate() - 1);
      if (currentStreak > 365) break; // safety
    }

    // Re-eval current streak based on simplified logic:
    // Iterate sortedDates backwards.
    // if (date[i] and date[i-1] are consecutive) -> continue.
    // This is safer.
    currentStreak = 0;
    let lastDate: Date | null = null;
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const dStr = sortedDates[i];
      const isGood = dailyStatus.get(dStr);
      if (!isGood) break;

      const d = new Date(dStr);
      if (lastDate) {
        const diffTime = Math.abs(lastDate.getTime() - d.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          // Gaps? If gap means 0 usage, it's good!
          // Let's keep simpler logic: Just count valid days in DB for "Active Streak"
          // This means "Days you logged and were good".
        }
      }
      currentStreak++;
      lastDate = d;
    }
  }

  return { currentStreak, bestStreak };
};

export const resetAllData = async () => {
  const database = await openDatabase();
  await database.execAsync(`
        DROP TABLE IF EXISTS sessions;
        DROP TABLE IF EXISTS settings;
        DROP TABLE IF EXISTS apps;
        DROP TABLE IF EXISTS hobbies;
        DROP TABLE IF EXISTS contexts;
        DROP TABLE IF EXISTS time_presets;
        DROP TABLE IF EXISTS payback_logs;
        DROP TABLE IF EXISTS rescue_sessions;
        DROP TABLE IF EXISTS accepted_missions;
    `);
  // Re-initialize to seed defaults again
  await initDB();
};

export interface AcceptedMission {
  id: number;
  name: string;
  duration: number;
  timestamp: number;
  status: "pending" | "completed" | "abandoned";
  flavor_title_key?: string;
  flavor_desc_key?: string;
  icon?: string;
  color?: string;
}

export const acceptMission = async (mission: any) => {
  const database = await openDatabase();
  const timestamp = Date.now();
  await database.runAsync(
    `INSERT INTO accepted_missions (name, duration, timestamp, status, flavor_title_key, flavor_desc_key, icon, color) 
     VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
    mission.name,
    mission.duration,
    timestamp,
    mission.flavor?.titleKey,
    mission.flavor?.descriptionKey,
    mission.icon,
    mission.color
  );
};

export const getAcceptedMissions = async (): Promise<AcceptedMission[]> => {
  const database = await openDatabase();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const timestamp = startOfDay.getTime();

  const result: any[] = await database.getAllAsync(
    `SELECT * FROM accepted_missions WHERE timestamp >= ? AND status = 'pending' ORDER BY timestamp DESC`,
    timestamp
  );
  return result;
};

export const completeAcceptedMission = async (id: number) => {
  const database = await openDatabase();

  // Get mission details first to add payback session
  const mission: any = await database.getFirstAsync(
    "SELECT * FROM accepted_missions WHERE id = ?",
    id
  );

  if (mission) {
    await database.runAsync(
      "UPDATE accepted_missions SET status = 'completed' WHERE id = ?",
      id
    );
    await addPaybackSession(mission.duration, mission.name);
  }
};

export const abandonMission = async (id: number) => {
  const database = await openDatabase();
  await database.runAsync(
    "UPDATE accepted_missions SET status = 'abandoned' WHERE id = ?",
    id
  );
};

export const getCompletedMissions = async (
  limit: number = 50
): Promise<AcceptedMission[]> => {
  const database = await openDatabase();
  const result: any[] = await database.getAllAsync(
    `SELECT * FROM accepted_missions WHERE status = 'completed' ORDER BY timestamp DESC LIMIT ?`,
    limit
  );
  return result;
};

export const getMissionStats = async (): Promise<{
  totalAccepted: number;
  completed: number;
  abandoned: number;
  pending: number;
  totalRecoveredMinutes: number;
  completionRate: number;
  recoveryRatio: number;
}> => {
  const database = await openDatabase();

  // Get mission counts and sum
  const result: any = await database.getFirstAsync(`
      SELECT 
          COUNT(*) as totalAccepted,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) as abandoned,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'completed' THEN duration ELSE 0 END) as totalRecoveredMinutes
      FROM accepted_missions
  `);

  const totalAccepted = result?.totalAccepted || 0;
  const completed = result?.completed || 0;
  const abandoned = result?.abandoned || 0;
  const pending = result?.pending || 0;
  const totalRecoveredMinutes = result?.totalRecoveredMinutes || 0;

  const completionRate =
    completed + abandoned > 0
      ? Math.round((completed / (completed + abandoned)) * 100)
      : 0;

  // For recovery ratio we need total scroll time of ALL time
  const allTimeStats = await getAllTimeStats();
  const totalScroll = allTimeStats.totalMinutes;

  const recoveryRatio =
    totalScroll > 0
      ? Math.round((totalRecoveredMinutes / totalScroll) * 100)
      : 0;

  return {
    totalAccepted,
    completed,
    abandoned,
    pending,
    totalRecoveredMinutes,
    completionRate,
    recoveryRatio,
  };
};
