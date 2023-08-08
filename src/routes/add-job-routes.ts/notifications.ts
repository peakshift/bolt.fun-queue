import { FastifyInstance } from 'fastify';
import { Type, Static } from '@sinclair/typebox';

export default async function notifications(fastify: FastifyInstance) {
  const newCommentNotificationBodySchema = Type.Object({
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
    '/new-comment',
    {
      schema: {
        body: newCommentNotificationBodySchema,
      },
    },
    async (request, reply) => {
      const { comment, callback_url } = request.body as Static<
        typeof newCommentNotificationBodySchema
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
