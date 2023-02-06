import { FastifyPluginCallback } from 'fastify';
import { createQueue } from '../queue';
import { createNotificationsWorker } from '../workers/notifications_worker';
import fp from 'fastify-plugin';
import { createNostrWorker } from '../workers/nostr_worker';
import { env } from '../env';

const handler: FastifyPluginCallback = async (fastify, options, done) => {
  if (!fastify.queues) {
    let queues = {} as any;

    const NAME_SUFFIX = env.NODE_ENV === 'development' ? 'development' : '';

    const notificationsQueue = createQueue('Notifications Queue' + NAME_SUFFIX);
    queues['notifications'] = notificationsQueue;
    await createNotificationsWorker(notificationsQueue.name);

    const nostrQueue = createQueue('Nostr Queue' + NAME_SUFFIX, {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    });
    queues['nostr'] = nostrQueue;
    await createNostrWorker(nostrQueue.name);

    fastify.decorate('queues', queues);
  }

  done();
};

export default fp(handler, { name: 'queues' });
