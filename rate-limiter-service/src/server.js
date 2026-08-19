const express = require('express');
const { rateLimiter, peekBucket } = require('./middleware/rateLimiter');
require('dotenv').config();

const app = express();

// Strict limit on this route: 5 requests, refill 1 per 2 sec
app.get(
  '/api/data',
  rateLimiter({ capacity: 5, refillRate: 0.5 }),
  (req, res) => {
    res.json({ message: 'Here is your data', time: new Date().toISOString() });
  }
);
app.get('/api/status', async (req, res) => {
  const status = await peekBucket(req.ip, 5, 0.5);
  res.json(status);
});

// Add this line before app.listen() to serve the dashboard:
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});