import { ConnectionOptions, Processor, Queue, Worker } from 'bullmq';

import { env } from './env';

const connection: ConnectionOptions = {
  host: env.REDISHOST,
  port: env.REDISPORT,
  username: env.REDISUSER,
  password: env.REDISPASSWORD,
};

export const createQueue = (name: string) => new Queue(name, { connection });

export const createWorker = async (queueName: string, processor: Processor) => {
  return new Worker(queueName, processor, { connection });
};
