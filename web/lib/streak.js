export function computeStreaks(dateStrings) {
  const days = [...new Set(dateStrings)].sort();
  const daySet = new Set(days);

  let longest = 0;
  let run = 0;
  let previous = null;

  for (const day of days) {
    if (previous) {
      const previousDate = new Date(`${previous}T00:00:00.000Z`);
      previousDate.setUTCDate(previousDate.getUTCDate() + 1);
      const expected = previousDate.toISOString().slice(0, 10);
      run = expected === day ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    previous = day;
  }

  const cursor = new Date();
  if (!daySet.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let current = 0;
  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return { current, longest, activeDays: days.length };
}

const HEAT_THRESHOLDS = [30, 60, 120];

export function heatLevel(minutes) {
  if (!minutes || minutes <= 0) return 0;
  if (minutes < HEAT_THRESHOLDS[0]) return 1;
  if (minutes < HEAT_THRESHOLDS[1]) return 2;
  if (minutes < HEAT_THRESHOLDS[2]) return 3;
  return 4;
}

/**
 * Builds a GitHub-style activity grid: columns are calendar weeks (Sun-Sat),
 * padded so the grid always starts on a Sunday and ends on the most recent
 * Saturday, with future days marked so they render blank instead of "0".
 */
export function buildActivityGrid(minutesByDay, weeksBack = 13) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const gridEnd = new Date(today);
  gridEnd.setUTCDate(today.getUTCDate() + (6 - today.getUTCDay()));

  const gridStart = new Date(gridEnd);
  gridStart.setUTCDate(gridEnd.getUTCDate() - (weeksBack * 7 - 1));
  gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());

  const weeks = [];
  const monthLabels = [];
  let cursor = new Date(gridStart);
  let lastMonth = null;
  let weekIndex = 0;

  while (cursor <= gridEnd) {
    const week = [];
    for (let day = 0; day < 7; day += 1) {
      const key = cursor.toISOString().slice(0, 10);
      const future = cursor > today;
      week.push({ date: key, minutes: future ? 0 : minutesByDay[key] || 0, future });

      if (day === 0) {
        const month = cursor.toLocaleDateString("en", { month: "short" });
        if (month !== lastMonth) {
          monthLabels.push({ weekIndex, label: month });
          lastMonth = month;
        }
      }

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
    weekIndex += 1;
  }

  return { weeks, monthLabels };
}

export const RESERVED_USERNAMES = new Set([
  "admin", "api", "app", "login", "logout", "dashboard", "superadmin",
  "u", "user", "users", "settings", "profile", "about", "help", "support",
  "static", "public", "assets", "track-time", "tracktime", "null", "undefined",
]);
