import {
  ConnectionOptions,
  Processor,
  Queue,
  QueueOptions,
  Worker,
} from 'bullmq';

import { env } from './env';

const connection: ConnectionOptions = {
  host: env.REDISHOST,
  port: env.REDISPORT,
  username: env.REDISUSER,
  password: env.REDISPASSWORD,
};

export const createQueue = (
  name: string,
  options?: Omit<QueueOptions, 'connection'>
) => new Queue(name, { connection, ...options });

export const createWorker = async <T = any, R = any, N extends string = string>(
  queueName: string,
  processor: Processor<T, R, N>
) => {
  const worker = new Worker(queueName, processor, { connection });

  worker.on('failed', (job) => {
    console.log(`Job ${job?.name} failed`);
  });

   
  return worker;
};
