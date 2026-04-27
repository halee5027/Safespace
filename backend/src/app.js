console.log("APP.JS LOADED ✅");

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

// CORS
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
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);

// Body parsing
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ ROOT ROUTE (KEEP THIS BEFORE ALL ROUTES)
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SafeSpace AI Backend is LIVE 🚀'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SafeSpace AI backend' });
});

// ✅ IMPORTANT: PREFIX ALL ROUTES
app.use('/api/moderation', moderationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/seed', seedRoutes);

// 404 + error handlers (ALWAYS LAST)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
