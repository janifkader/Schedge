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