import { createWorker } from '../queue';

export const createNotificationsWorker = (queueName = 'notifications') =>
  createWorker(queueName, async (job) => {
    job.log('INSIDE NOTIFICATIONS WORKER');
    return {
      data: job.id,
    };
  });
