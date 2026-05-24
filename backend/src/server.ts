import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { startEventReminderJob } from "./jobs/reminders";
import app from "./app";

const PORT = process.env.PORT || 4000;
const server = createServer(app);

async function startServer() {
  try {
    //startEventReminderJob();
    server.listen(PORT, () => {
      console.log(`HTTP Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to establish database connection:", error);
    process.exit();
  }
}

startServer();
