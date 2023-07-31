import { Queue } from 'bullmq';

declare module 'fastify' {
  export interface FastifyInstance {
    queues: {
      notifications: Queue<
        NotificationsQueue['Job'],
        any,
        NotificationsQueue['JobNames']
      >;
      nostr: Queue<NostrQueue['Job'], any, NostrQueue['JobNames']>;
      emails: Queue<EmailsQueue['Job'], any, EmailsQueue['JobNames']>;
    };
  }
}
