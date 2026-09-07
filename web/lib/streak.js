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

export const RESERVED_USERNAMES = new Set([
  "admin", "api", "app", "login", "logout", "dashboard", "superadmin",
  "u", "user", "users", "settings", "profile", "about", "help", "support",
  "static", "public", "assets", "track-time", "tracktime", "null", "undefined",
]);
