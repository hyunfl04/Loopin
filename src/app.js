const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cookieParser());
const PORT = process.env.PORT || 3001;

// --- 1. MIDDLEWARE (Must be before Routes) ---
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- 2. API ROUTES ---
const authRoutes = require('./routes/authRoutes');
const habitRoutes = require('./routes/habitRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/users', userRoutes);

// --- 3. STATIC FILES & PAGES ---
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, '../public/signup.html')));
app.get('/home', (req, res) => res.sendFile(path.join(__dirname, '../public/home.html')));
// --- 4. SERVICES & DATABASE ---
require('./services/notificationService');
// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📱 Open http://localhost:${PORT} in your browser`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Starting server without database...');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT} (No DB)`);
    });
  });
