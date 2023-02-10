import { FastifyInstance } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import basicAuthPlugin from '@fastify/basic-auth';
import { validate } from '../utils/auth';

export default async function storyRoutes(fastify: FastifyInstance) {
  fastify.register(basicAuthPlugin, { validate, authenticate: true });

  fastify.after(() => {
    fastify.addHook('onRequest', fastify.basicAuth);

    const publishStoryToNostrBodySchema = Type.Object({
      story: Type.Object({
        id: Type.String(),
        title: Type.String(),
        canonical_url: Type.String(),
        url: Type.String(),
      }),
      callback_url: Type.Optional(Type.String()),
    });

    fastify.post(
      '/publish-story-to-nostr',
      {
        schema: {
          body: publishStoryToNostrBodySchema,
        },
      },
      async (request, reply) => {
        const { story, callback_url } = request.body as Static<
          typeof publishStoryToNostrBodySchema
        >;
        fastify.queues.nostr.add('create-story-root-event', {
          type: 'create-story-root-event',
          story,
          callback_url,
        });

        reply.send({ status: 'OK' });
      }
    );
  });

  const newCommentNotificationBodyScheam = Type.Object({
    comment: Type.Object({
      event_id: Type.String(),
      canonical_url: Type.String(),
      url: Type.String(),
      content: Type.String(),
      pubkey: Type.String(),
      story_id: Type.String(),
    }),
    callback_url: Type.Optional(Type.String()),
  });

  fastify.post(
    '/new-comment-notification',
    {
      schema: {
        body: newCommentNotificationBodyScheam,
      },
    },
    async (request, reply) => {
      const { comment, callback_url } = request.body as Static<
        typeof newCommentNotificationBodyScheam
      >;
      fastify.queues.notifications.add(`new-comment`, {
        type: 'new-comment',
        comment,
        callback_url,
      });

      reply.send({ status: 'OK' });
    }
  );
}
