const { Worker } = require('bullmq');
const connection = require('./config/redis');

const worker = new Worker(
  'email-queue',
  async (job) => {
    const { email, name } = job.data;

    console.log(`Processing job ${job.id}: sending email to ${email}`);

    // Simulate sending an email (replace with real email service later)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate random failure, 30% of the time — to test retry behavior
    if (Math.random() < 0.3) {
      throw new Error('Simulated email service failure');
    }

    console.log(`Email sent to ${email} (${name})`);
    return { sent: true, email };
  },
  { connection, concurrency: 2 }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed: ${err.message} (attempt ${job.attemptsMade}/${job.opts.attempts})`);
});

console.log('Worker started, listening for jobs...');