const DAY_IN_MS = 24 * 60 * 60 * 1000;

const SECONDS_THRESHOLD = 1e11;

export const getUtcDayRange = (timestamp: number): { start: Date; end: Date } | null => {
  const ms = timestamp < SECONDS_THRESHOLD ? timestamp * 1000 : timestamp;
  const date = new Date(ms);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start.getTime() + DAY_IN_MS);

  return { start, end };
};
