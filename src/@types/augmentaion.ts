import { Queue } from 'bullmq';
import {
  AIQueue,
  EmailsQueue,
  NostrQueue,
  NotificationsQueue,
  SearchQueue,
} from './queues.types';

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
      search: Queue<SearchQueue['Job'], any, SearchQueue['JobNames']>;
      ai: Queue<AIQueue['Job'], any, AIQueue['JobNames']>;
    };
  }
}
