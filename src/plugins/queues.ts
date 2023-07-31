import { FastifyPluginCallback } from 'fastify';
import { createQueue } from '../queue';
import { createNotificationsWorker } from '../workers/notifications_worker';
import fp from 'fastify-plugin';
import { createNostrWorker } from '../workers/nostr_worker';
import { env } from '../env';
import { createEmailsWorker } from '../workers/emails_worker';

const handler: FastifyPluginCallback = async (fastify, options, done) => {
  if (!fastify.queues) {
    let queues = {} as any;

    const NAME_SUFFIX = env.NODE_ENV === 'development' ? ' (Development)' : '';

    const notificationsQueue = createQueue('Notifications Queue' + NAME_SUFFIX);

    const emailsQueue = createQueue('Emails Queue' + NAME_SUFFIX);

    const nostrQueue = createQueue('Nostr Queue' + NAME_SUFFIX, {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    });

    await Promise.all([
      createEmailsWorker(emailsQueue.name),
      createNotificationsWorker(notificationsQueue.name),
      createNostrWorker(nostrQueue.name),
    ]);

    queues['nostr'] = nostrQueue;
    queues['notifications'] = notificationsQueue;
    queues['emails'] = emailsQueue;

    fastify.decorate('queues', queues);
  }

  done();
};

export default fp(handler, { name: 'queues' });
