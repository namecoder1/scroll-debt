import { addSession, getSelectedApps, getSetting, openDatabase } from "./db";

// Utils to get random items
const getRandomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const fillWeekWithMockData = async () => {
  const db = await openDatabase();

  // Fetch available apps, contexts, and budget
  const apps = await getSelectedApps();
  const contexts: any[] = await db.getAllAsync("SELECT name FROM contexts");
  const budgetStr = await getSetting("daily_scroll_budget");
  const budget = budgetStr ? parseInt(budgetStr) : 60;

  if (apps.length === 0 || contexts.length === 0) {
    console.error("No apps or contexts found to generate mock data");
    return;
  }

  // Calculate last 7 days (including today)
  const today = new Date();

  // Generate for today and the past 6 days
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(today);
    currentDay.setDate(today.getDate() - i);
    currentDay.setHours(0, 0, 0, 0);

    // Target total duration to be safe (50% to 90% of budget)
    const targetPercentage = getRandomInt(50, 90) / 100;
    const targetDuration = Math.max(10, Math.floor(budget * targetPercentage));

    let currentDuration = 0;

    // Generate sessions until we reach target
    while (currentDuration < targetDuration) {
      // Remaining time
      const remaining = targetDuration - currentDuration;
      // Random chunk (5 to remaining, capped at 30)
      const chunk = getRandomInt(5, Math.min(30, remaining));

      // Add session
      const app = getRandomItem(apps).name;
      const context = getRandomItem(contexts).name;

      // Random time
      const hour = getRandomInt(8, 23);
      const minute = getRandomInt(0, 59);

      const sessionDate = new Date(currentDay);
      sessionDate.setHours(hour, minute, 0, 0);

      await addSession(chunk, app, context, sessionDate.getTime());
      currentDuration += chunk;
    }
  }
};

export const fillMonthWithMockData = async () => {
  const db = await openDatabase();

  const apps = await getSelectedApps();
  const contexts: any[] = await db.getAllAsync("SELECT name FROM contexts");
  const budgetStr = await getSetting("daily_scroll_budget");
  const budget = budgetStr ? parseInt(budgetStr) : 60;

  if (apps.length === 0 || contexts.length === 0) {
    console.error("No apps or contexts found to generate mock data");
    return;
  }

  const today = new Date();
  const currentDayOfMonth = today.getDate();
  const currentMonthIdx = today.getMonth(); // 0-indexed
  const currentYear = today.getFullYear();

  // Iterate from day 1 up to today
  for (let day = 1; day <= currentDayOfMonth; day++) {
    const dayDate = new Date(currentYear, currentMonthIdx, day);

    // Skip if somehow we went into the future (redundant with loop condition but safe)
    if (dayDate > today) break;

    const targetPercentage = getRandomInt(50, 90) / 100;
    const targetDuration = Math.max(10, Math.floor(budget * targetPercentage));
    let currentDuration = 0;

    while (currentDuration < targetDuration) {
      const remaining = targetDuration - currentDuration;
      const chunk = getRandomInt(5, Math.min(30, remaining));
      const app = getRandomItem(apps).name;
      const context = getRandomItem(contexts).name;
      const hour = getRandomInt(8, 23);
      const minute = getRandomInt(0, 59);

      const sessionDate = new Date(dayDate);
      sessionDate.setHours(hour, minute, 0, 0);

      // Safety check: don't create sessions in the future hours of today
      if (sessionDate > today) continue;

      await addSession(chunk, app, context, sessionDate.getTime());
      currentDuration += chunk;
    }
  }
};

export const clearAllData = async () => {
  const db = await openDatabase();
  await db.runAsync("DELETE FROM sessions");
  await db.runAsync("DELETE FROM accepted_missions");
  // keeping playback_logs or settings intact?
  // "cancellare tutto" usually implies resetting user data.
  // Let's delete history.
  await db.runAsync("DELETE FROM payback_logs");
  await db.runAsync("DELETE FROM rescue_sessions");
};
