import {
  getInstallDate,
  getMissionsCompletedCount,
  hasSocialSessionSince,
  openDatabase,
} from "./db";

export interface BadgeDefinition {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string; // Ionicons name
  color: {
    light: string;
    dark: string;
  };
  group?: string;
}

export const BADGES: BadgeDefinition[] = [
  {
    id: "first_debt",
    titleKey: "awards.badges.first_debt.title",
    descKey: "awards.badges.first_debt.desc",
    icon: "footsteps",
    color: { dark: "#3b82f6", light: "#3b82f6" }, // blue
  },
  {
    id: "aware",
    titleKey: "awards.badges.aware.title",
    descKey: "awards.badges.aware.desc",
    icon: "eye",
    color: { dark: "#8b5cf6", light: "#8b5cf6" }, // violet
  },
  {
    id: "marathon",
    titleKey: "awards.badges.marathon.title",
    descKey: "awards.badges.marathon.desc",
    icon: "timer",
    color: { dark: "#ef4444", light: "#ef4444" }, // red
  },
  {
    id: "social_butterfly",
    titleKey: "awards.badges.social_butterfly.title",
    descKey: "awards.badges.social_butterfly.desc",
    icon: "people",
    color: { dark: "#ec4899", light: "#ec4899" }, // pink
  },
  {
    id: "explorer",
    titleKey: "awards.badges.explorer.title",
    descKey: "awards.badges.explorer.desc",
    icon: "map",
    color: { dark: "#f59e0b", light: "#f59e0b" }, // amber
  },
  {
    id: "night_owl",
    titleKey: "awards.badges.night_owl.title",
    descKey: "awards.badges.night_owl.desc",
    icon: "moon",
    color: { dark: "#6366f1", light: "#6366f1" }, // indigo
  },
  {
    id: "early_bird",
    titleKey: "awards.badges.early_bird.title",
    descKey: "awards.badges.early_bird.desc",
    icon: "sunny",
    color: { dark: "#eab308", light: "#eab308" }, // yellow
  },
  {
    id: "streak_3",
    titleKey: "awards.badges.streak_3.title",
    descKey: "awards.badges.streak_3.desc",
    icon: "flame",
    color: { dark: "#f97316", light: "#f97316" }, // orange
  },
  {
    id: "master",
    titleKey: "awards.badges.master.title",
    descKey: "awards.badges.master.desc",
    icon: "trophy",
    color: { dark: "#10b981", light: "#10b981" }, // emerald
  },
  {
    id: "zen",
    titleKey: "awards.badges.zen.title",
    descKey: "awards.badges.zen.desc",
    icon: "leaf",
    color: { dark: "#22c55e", light: "#22c55e" }, // green
  },
  {
    id: "mission_daily_1",
    titleKey: "awards.badges.mission_daily_1.title",
    descKey: "awards.badges.mission_daily_1.desc",
    icon: "checkmark-circle",
    color: { dark: "#8b5cf6", light: "#8b5cf6" }, // violet
    group: "mission_daily",
  },
  {
    id: "mission_daily_2",
    titleKey: "awards.badges.mission_daily_2.title",
    descKey: "awards.badges.mission_daily_2.desc",
    icon: "layers",
    color: { dark: "#a855f7", light: "#a855f7" }, // purple
    group: "mission_daily",
  },
  {
    id: "mission_daily_3",
    titleKey: "awards.badges.mission_daily_3.title",
    descKey: "awards.badges.mission_daily_3.desc",
    icon: "ribbon",
    color: { dark: "#d946ef", light: "#d946ef" }, // fuchsia
    group: "mission_daily",
  },
  {
    id: "social_detox_1",
    titleKey: "awards.badges.social_detox_1.title",
    descKey: "awards.badges.social_detox_1.desc",
    icon: "water",
    color: { dark: "#06b6d4", light: "#06b6d4" }, // cyan
    group: "social_detox",
  },
  {
    id: "social_detox_2",
    titleKey: "awards.badges.social_detox_2.title",
    descKey: "awards.badges.social_detox_2.desc",
    icon: "water",
    color: { dark: "#06b6d4", light: "#06b6d4" }, // cyan
    group: "social_detox",
  },
  {
    id: "social_detox_3",
    titleKey: "awards.badges.social_detox_3.title",
    descKey: "awards.badges.social_detox_3.desc",
    icon: "water",
    color: { dark: "#0ea5e9", light: "#0ea5e9" }, // sky
    group: "social_detox",
  },
];

export const checkForNewAwards = async (): Promise<BadgeDefinition[]> => {
  const db = await openDatabase();

  // 1. Get existing awards first to optimize checks
  const existingRecords = await db.getAllAsync(
    "SELECT badge_id FROM unlocked_awards"
  );
  const existingIds = new Set(existingRecords.map((r: any) => r.badge_id));
  const newBadges: BadgeDefinition[] = [];

  // Helper to add award if not exists
  const checkAndAdd = async (id: string, condition: boolean) => {
    // console.log(`[AWARDS_DEBUG] Checking ${id}: condition=${condition}, exists=${existingIds.has(id)}`);
    if (condition && !existingIds.has(id)) {
      await db.runAsync(
        "INSERT OR IGNORE INTO unlocked_awards (badge_id, timestamp, seen) VALUES (?, ?, 0)",
        id,
        Date.now()
      );
      const badgeDef = BADGES.find((b) => b.id === id);
      if (badgeDef) {
        newBadges.push(badgeDef);
      }
    }
  };

  // 2. Gather General Stats (only if needed)
  // We can skip these queries if we already have the related badges, but for simplicity/robustness
  // we'll run them if at least one related badge is missing.

  const hasAllGeneral = [
    "first_debt",
    "aware",
    "master",
    "marathon",
    "social_butterfly",
    "explorer",
  ].every((id) => existingIds.has(id));

  if (!hasAllGeneral) {
    const sessionCount =
      ((await db.getFirstAsync("SELECT count(*) as c FROM sessions")) as any)
        ?.c || 0;

    // console.log(`[AWARDS_DEBUG] Session Count: ${sessionCount}`);

    const distinctAppsRes = await db.getFirstAsync(
      "SELECT count(distinct app_name) as c FROM sessions"
    );
    const distinctApps = (distinctAppsRes as any)?.c || 0;

    const distinctContextsRes = await db.getFirstAsync(
      "SELECT count(distinct context) as c FROM sessions"
    );
    const distinctContexts = (distinctContextsRes as any)?.c || 0;

    const marathonSession = await db.getFirstAsync(
      "SELECT 1 FROM sessions WHERE duration > 60"
    );

    await checkAndAdd("first_debt", sessionCount > 0);
    await checkAndAdd("aware", sessionCount >= 5);
    await checkAndAdd("marathon", marathonSession !== null);
    await checkAndAdd("social_butterfly", distinctApps >= 3);
    await checkAndAdd("explorer", distinctContexts >= 3);
    await checkAndAdd("master", sessionCount >= 100);
  }

  // 3. Social Detox Logic (Fixed)
  const hasAllDetox = [
    "social_detox_1",
    "social_detox_2",
    "social_detox_3",
  ].every((id) => existingIds.has(id));

  if (!hasAllDetox) {
    const now = Date.now();
    const installDate = await getInstallDate();

    // Calculate Monday 00:00 of current week
    // If today is Mon(1), diff=0. If Sun(0), diff=-6.
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const resultMonday = monday.getTime();

    // The reference start time is either the start of the current week OR the install date, whichever is later.
    // This ensures we don't give awards for "empty" time before the user even installed the app,
    // AND we don't give awards for time outside the current week (reset logic).
    const referenceStart = Math.max(resultMonday, installDate);

    // Check function
    const checkDetox = async (hours: number, id: string) => {
      if (existingIds.has(id)) return; // Already have it

      const durationMs = hours * 60 * 60 * 1000;
      const timeSinceReference = now - referenceStart;

      // CRITICAL CHECK 1: Has enough time passed since reference point?
      if (timeSinceReference < durationMs) {
        // Not enough time has passed in the current valid period (Week or Install)
        return;
      }

      // CRITICAL CHECK 2: Has social session in the lookback period?
      const lookbackTime = now - durationMs;
      const hasSocial = await hasSocialSessionSince(lookbackTime);

      if (!hasSocial) {
        await checkAndAdd(id, true);
      }
    };

    await checkDetox(24, "social_detox_1");
    await checkDetox(48, "social_detox_2");
    await checkDetox(72, "social_detox_3");
  }

  // 4. Mission Warrior Logic
  const hasAllMissions = [
    "mission_daily_1",
    "mission_daily_2",
    "mission_daily_3",
  ].every((id) => existingIds.has(id));

  if (!hasAllMissions) {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const missionsToday = await getMissionsCompletedCount(
      startOfDay.getTime(),
      now
    );

    await checkAndAdd("mission_daily_1", missionsToday >= 1);
    await checkAndAdd("mission_daily_2", missionsToday >= 2);
    await checkAndAdd("mission_daily_3", missionsToday >= 3);
  }

  return newBadges;
};

export const getUnseenAwards = async (): Promise<BadgeDefinition[]> => {
  const db = await openDatabase();
  const rows = await db.getAllAsync(
    "SELECT badge_id FROM unlocked_awards WHERE seen = 0"
  );
  const ids = rows.map((r: any) => r.badge_id);
  return BADGES.filter((b) => ids.includes(b.id));
};

export const markAwardSeen = async (badgeId: string) => {
  const db = await openDatabase();
  await db.runAsync(
    "UPDATE unlocked_awards SET seen = 1 WHERE badge_id = ?",
    badgeId
  );
};

export const getAllUnlockedAwards = async (): Promise<Map<string, number>> => {
  const db = await openDatabase();
  const rows = await db.getAllAsync(
    "SELECT badge_id, timestamp FROM unlocked_awards"
  );
  const map = new Map<string, number>();
  rows.forEach((r: any) => map.set(r.badge_id, r.timestamp));
  return map;
};
