import { prisma } from "../database";

export type EventInterval = {
  event_id: string;
  title: string;
  start_time: Date;
  end_time: Date;
  weight: number;
};

export const getConflicts = (
  newEvent: { start_time: Date; end_time: Date; weight: number },
  existing: EventInterval[]
) => {
  return existing.filter(
    (e) =>
      e.start_time < newEvent.end_time &&
      e.end_time > newEvent.start_time
  );
};

export const getHigherWeightConflicts = (
  newEvent: { start_time: Date; end_time: Date; weight: number },
  existing: EventInterval[]
) => {
  return getConflicts(newEvent, existing).filter(
    (e) => e.weight >= newEvent.weight
  );
};

export const getExistingEvents = async (
  scheduleId: string,
  start: Date,
  end: Date
): Promise<EventInterval[]> => {
  return prisma.event.findMany({
    where: {
      schedule_id: scheduleId,
      start_time: { lt: end },
      end_time: { gt: start },
    },
    select: {
      event_id: true,
      title: true,
      start_time: true,
      end_time: true,
      weight: true,
    },
  });
};

// Find latest event that ends before the current one starts
const latestNonOverlapping = (events: EventInterval[], i: number): number => {
  for (let j = i - 1; j >= 0; j--) {
    if (events[j].end_time <= events[i].start_time) return j;
  }
  return -1;
};

export const weightedIntervalSchedule = (events: EventInterval[]): EventInterval[] => {
  if (events.length === 0) return [];

  // Sort by end time
  const sorted = [...events].sort((a, b) => 
    a.end_time.getTime() - b.end_time.getTime()
  );

  const n = sorted.length;
  const dp = new Array(n).fill(0);
  dp[0] = sorted[0].weight;

  for (let i = 1; i < n; i++) {
    const j = latestNonOverlapping(sorted, i);
    const includeWeight = sorted[i].weight + (j >= 0 ? dp[j] : 0);
    dp[i] = Math.max(includeWeight, dp[i - 1]);
  }

  // Backtrack to find which events are in the optimal set
  const result: EventInterval[] = [];
  let i = n - 1;
  while (i >= 0) {
    const j = latestNonOverlapping(sorted, i);
    const includeWeight = sorted[i].weight + (j >= 0 ? dp[j] : 0);
    if (i === 0 || includeWeight >= dp[i - 1]) {
      result.push(sorted[i]);
      i = j;
    } else {
      i--;
    }
  }

  return result;
};