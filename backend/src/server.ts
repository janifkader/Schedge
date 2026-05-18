import { createServer } from "http";
import app from "./app";

const PORT = process.env.PORT || 4000;
const server = createServer(app);

async function startServer() {
  try {
    server.listen(PORT, () => {
      console.log(`HTTP Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to establish database connection:", error);
    process.exit();
  }
}

startServer();
