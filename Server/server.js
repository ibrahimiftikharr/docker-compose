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

// ---------- Middlewares ----------
app.use(cors({ origin: '*' }));
app.use(express.json());

// ---------- Connect to MongoDB ----------
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ---------- API Routes ----------
app.use('/auth', authRoutes);
app.use('/employer', authenticateToken, employerRoutes);
app.use('/jobseeker', authenticateToken, jobSeekerRoutes);

// ---------- Serve React Frontend ----------
const staticPath = path.join(__dirname, '../Client/Jobify/dist'); 
app.use(express.static(staticPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// -----------------------------------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`The server is running on port ${PORT}`));
