console.log("SERVER.JS RUNNING 🚀");
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const env = require('./config/env');
const connectDb = require('./config/db');
const registerChatSocket = require('./sockets/chatSocket');

async function bootstrap() {
  await connectDb(env.mongoUri);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.clientOrigin,
      credentials: true
    }
  });

  app.set('io', io);
  registerChatSocket(io);

  server.listen(env.port, () => {
    console.log(`SafeSpace backend running on port ${env.port}`);
  });
}

bootstrap();
