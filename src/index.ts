import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { env } from './env';
import addJobRoutes from './routes/add-job.routes';
import { createQueue } from './queue';
import { createNotificationsWorker } from './workers/notifications_worker';
import { validate } from './utils/auth';
import queuesPlugin from './plugins/queues';

interface AddJobQueryString {
  id: string;
  email: string;
}

const run = async () => {
  const notificationsQueue = createQueue('Notifications Queue');
  await createNotificationsWorker(notificationsQueue.name);

  const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
    fastify();

  server.register(queuesPlugin);

  const serverAdapter = new FastifyAdapter();
  server.register((fastify, opts, done) => {
    createBullBoard({
      queues: [
        new BullMQAdapter(fastify.queues.nostr),
        new BullMQAdapter(fastify.queues.notifications),
      ],
      serverAdapter,
    });
    done();
  });
  serverAdapter.setBasePath('/');
  server.register(serverAdapter.registerPlugin(), {
    prefix: '/',
    basePath: '/',
  });

  server.register(addJobRoutes, { prefix: '/add-job' });

  // server.get(
  //   '/add-job',
  //   {
  //     schema: {
  //       querystring: {
  //         type: 'object',
  //         properties: {
  //           title: { type: 'string' },
  //           id: { type: 'string' },
  //         },
  //       },
  //     },
  //   },
  //   (req: FastifyRequest<{ Querystring: AddJobQueryString }>, reply) => {
  //     if (
  //       req.query == null ||
  //       req.query.email == null ||
  //       req.query.id == null
  //     ) {
  //       reply
  //         .status(400)
  //         .send({ error: 'Requests must contain both an id and a email' });

  //       return;
  //     }

  //     const { email, id } = req.query;
  //     notificationsQueue.add(`WelcomeEmail-${id}`, { email });

  //     reply.send({
  //       ok: true,
  //     });
  //   }
  // );

  await server.listen({
    port: env.PORT,
    host: env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0',
  });
  console.log(`Server running on ${env.RAILWAY_STATIC_URL}`);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
