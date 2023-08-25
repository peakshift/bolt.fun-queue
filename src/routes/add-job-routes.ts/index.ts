import { FastifyInstance } from 'fastify';
import basicAuthPlugin from '@fastify/basic-auth';
import { validate } from '../../utils/auth';

import notificationsRoutes from './notifications';
import nostrRoutes from './nostr';
import emailsRoutes from './emails';
import searchRoutes from './search';

export default async function storyRoutes(fastify: FastifyInstance) {
  fastify.register(basicAuthPlugin, { validate, authenticate: true });

  fastify.after(() => {
    fastify.addHook('onRequest', fastify.basicAuth);

    fastify.register(notificationsRoutes, { prefix: '/notifications' });

    fastify.register(nostrRoutes, { prefix: '/nostr' });

    fastify.register(emailsRoutes, { prefix: '/emails' });

    fastify.register(searchRoutes, { prefix: '/search' });
  });
}
