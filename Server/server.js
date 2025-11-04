require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authenticateToken = require('./middleware/authenticateToken');
const authRoutes = require('./routes/authRoutes');
const employerRoutes = require('./routes/employerRoutes');
const jobSeekerRoutes = require('./routes/jobSeekerRoutes');

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(cors({ origin: '*' }));
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/jobify')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));


// API Routes
// API Routes
app.use('/auth', authRoutes);
app.use('/employer', authenticateToken, employerRoutes);
app.use('/jobseeker', authenticateToken, jobSeekerRoutes);

// ---------- Serve React Frontend ----------
const __dirnamePath = path.resolve();
app.use(express.static(path.join(__dirnamePath, '../Client/Jobify/dist')));

// Catch-all for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirnamePath, '../Client/Jobify/dist', 'index.html'));
});
// -----------------------------------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
