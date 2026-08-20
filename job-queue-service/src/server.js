const express = require('express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const emailQueue = require('./queues/emailQueue');
require('dotenv').config();

const app = express();
app.use(express.json());
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter
});

app.use('/admin/queues', serverAdapter.getRouter());
app.use(express.static('public'));
app.post('/api/signup', async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'email and name are required' });
  }

  // Simulate user creation (in real app, this would save to a DB)
  console.log(`User created: ${name} (${email})`);

  // Add job to queue instead of sending email directly
  await emailQueue.add(
    'send-welcome-email',
    { email, name },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    }
  );

  // Respond immediately — don't make user wait for email to send
  res.status(201).json({ message: 'Signup successful', email });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});