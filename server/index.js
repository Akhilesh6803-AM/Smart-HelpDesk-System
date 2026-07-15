require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose     = require('mongoose');

const authRoutes   = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const aiRoutes     = require('./routes/aiRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const faqRoutes    = require('./routes/faqRoutes');
const userRoutes   = require('./routes/userRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_URL]
  : [/^http:\/\/localhost:\d+$/]; // allow any localhost port in dev

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // allow cookies to be sent cross-origin
  })
);

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Cookie Parser ───────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/tickets', ticketRoutes);
app.use('/ai', aiRoutes);
app.use('/notifications', notificationRoutes);
app.use('/notices', noticeRoutes);
app.use('/faqs', faqRoutes);
app.use('/users', userRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Smart Helpdesk API is running 🚀' });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message    = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ─── Database + Server Startup ───────────────────────────────────────────────
const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`🚀  Smart Helpdesk server running on http://localhost:${PORT}`);
      console.log(`🌍  Accepting requests from: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    });
  } catch (err) {
    console.error('❌  Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
