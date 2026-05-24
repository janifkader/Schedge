import cron from "node-cron";
import { prisma } from "../database";
import { sendSMS } from "../services/sms";

export const startEventReminderJob = () => {
  // Runs every minute
  cron.schedule("* * * * *", async () => {
    console.log("Reminder job running at", new Date().toISOString())
    try {
      const now = new Date();
      const reminderWindow = new Date(now.getTime() + 30 * 60 * 1000);

      const upcomingEvents = await prisma.event.findMany({
        where: {
          start_time: {
            gte: now,
            lte: reminderWindow,
          },
          reminded: false,
        },
        include: {
          participants: {
            include: {
              user: true,
            }
          }
        }
      });
      console.log("EVENTS FOUND: ");
      console.log(upcomingEvents);

      for (const event of upcomingEvents) {
        for (const { user } of event.participants) {
          if (!user || !user.phone || !user.name) continue;
          await sendSMS(
            user.phone,
            `Hey ${user.name}, ${event.title} starts at ${new Date(event.start_time).toLocaleTimeString("en-CA", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}`
          );
        }

        await prisma.event.update({
          where: { event_id: event.event_id },
          data: { reminded: true },
        });
      }
    } catch (error) {
      console.error("Reminder job failed:", error);
    }
  });

  console.log("Event reminder job started.");
};