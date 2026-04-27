console.log("SERVER.JS RUNNING 🚀");

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const env = require("./config/env");
const connectDb = require("./config/db");
const registerChatSocket = require("./sockets/chatSocket");

async function bootstrap() {
  try {
    // 1. DB CONNECT (must not crash server if fails)
    await connectDb(env.mongoUri);
    console.log("MongoDB connected ✅");

  } catch (err) {
    console.log("MongoDB failed ❌ (continuing without crash)", err.message);
  }

  // 2. CREATE SERVER
  const server = http.createServer(app);

  // 3. SOCKET SETUP
  const io = new Server(server, {
    cors: {
      origin: env.clientOrigin || "*",
      credentials: true
    }
  });

  app.set("io", io);
  registerChatSocket(io);

  // 4. DEBUG ROUTES (IMPORTANT FOR YOU)
  app.get("/__debug", (req, res) => {
    res.json({
      ok: true,
      message: "SERVER IS WORKING FROM src/server.js"
    });
  });

  app.get("/api/users", (req, res) => {
    res.json({
      ok: true,
      message: "USERS ROUTE WORKING DIRECTLY"
    });
  });

  // 5. START SERVER
  server.listen(env.port, () => {
    console.log(`🚀 SafeSpace backend running on port ${env.port}`);
  });
}

bootstrap();
