const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const moderationRoutes = require('./routes/moderationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const contentRoutes = require('./routes/contentRoutes');
const alertsRoutes = require('./routes/alertsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const seedRoutes = require('./routes/seedRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const allowedOrigins = new Set(
  [
    env.clientOrigin,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174'
  ].filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (curl/postman) and configured browser origins.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SafeSpace AI backend' });
});

app.use(moderationRoutes);
app.use(messageRoutes);
app.use(contentRoutes);
app.use(alertsRoutes);
app.use(adminRoutes);
app.use(reportRoutes);
app.use(userRoutes);
app.use(dashboardRoutes);
app.use(seedRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
