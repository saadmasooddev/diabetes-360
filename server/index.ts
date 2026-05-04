import { registerRoutes } from "./src/app/routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";
import { createApp } from "./src/app/app";
import { config } from "./src/app/config";
import { db } from "./src/app/config/db";
import { CronJobService } from "./src/shared/services/cron-job.service";
import { ChatService } from "./src/modules/chat/service/chat.service";
import { zoomService } from "./src/shared/services/zoom.service";
import { DateManager } from "./src/shared/utils/utils";
import { HealthService } from "./src/modules/health/service/health.service";
import { BookingService } from "./src/modules/booking/service/booking.service";

const app = createApp();

(async () => {
  const appWithRoutes = registerRoutes(app);
  const server = createServer(appWithRoutes);
  await db.execute("SELECT 1");

  const startTimeIso = DateManager.slotTimeToISO(
    "2026-01-13 00:00:00",
    "22:30:00",
    config.defaults.timezone,
  );

  console.log(
    "THe the start time iso log is",
    startTimeIso,
    "the local time is",
    new Date(startTimeIso),
  );



  const cronJobService = new CronJobService();
  cronJobService.registerAll([
    {
      name: "daily-health-summary",
      schedule: "0 0 * * *",
      handler: async () => {
        const chatService = new ChatService();
        await chatService.generateAndStoreDailySummaryJob();
      },
    },
    {
      name: "daily-chat-memories",
      schedule: "0 0 * * *",
      handler: async () => {
        const chatService = new ChatService();
        await chatService.extractAndStoreChatMemoriesJob();
      },
    },
    {
      name: "meeting-link",
      schedule: "*/3 * * * *",
      handler: async () => {
        await zoomService.processMeetingLinksJob();
      },
    },
    {
      name: "inactivity-push-notifications",
      schedule: "15 8 * * *",
      handler: async () => {
        const healthService = new HealthService();
        await healthService.runInactivityNotificationJob();
      },
    },
    {
      name: "meeting-reminder",
      schedule: "*/5 * * * *",
      handler: async () => {
        const bookingService = new BookingService();
        await bookingService.sendMeetingReminderJob(15);
      },
    },
  ]);
  cronJobService.start();

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = config.port;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      // reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
