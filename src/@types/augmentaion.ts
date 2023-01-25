import { Queue } from 'bullmq';

declare module 'fastify' {
  export interface FastifyInstance {
    queues: {
      notifications: Queue;
      nostr: Queue<NostrQueue['Job'], any, NostrQueue['JobNames']>;
    };
  }
}
