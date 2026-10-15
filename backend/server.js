require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
console.log("THE URL IS:", process.env.MONGO_URI);
// Connect to MongoDB
if (process.env.MONGO_URI) {
  connectDB();
} else {
  console.log('WARNING: MONGO_URI not found in .env file. Database not connected.');
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
const historyRoutes = require('./routes/history');
app.use('/api/history', historyRoutes);

app.get('/', (req, res) => {
  res.send('VIVID Auth Backend is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
