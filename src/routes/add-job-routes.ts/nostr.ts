import { FastifyInstance } from 'fastify';
import { Type, Static } from '@sinclair/typebox';

export default async function nostrRoutes(fastify: FastifyInstance) {
  const publishStoryToNostrBodySchema = Type.Object({
    story: Type.Object({
      id: Type.String(),
      title: Type.String(),
      canonical_url: Type.String(),
      url: Type.String(),
      author_name: Type.String(),
      author_nostr_pubkey: Type.Optional(Type.String()),
      tags: Type.Array(Type.String()),
    }),
    callback_url: Type.Optional(Type.String()),
  });

  fastify.post(
    '/publish-story-event',
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

  const publishProfileVerificationInput = Type.Object({
    event: Type.Object({
      id: Type.String(),
      kind: Type.Number(),
      pubkey: Type.String(),
      content: Type.String(),
      sig: Type.String(),
      created_at: Type.Number(),
      tags: Type.Array(Type.Array(Type.String())),
    }),
  });

  fastify.post(
    '/publish-profile-verification-event',
    {
      schema: {
        body: publishProfileVerificationInput,
      },
    },
    async (request, reply) => {
      const { event } = request.body as Static<
        typeof publishProfileVerificationInput
      >;
      fastify.queues.nostr.add('publish-profile-verification-event', {
        type: 'publish-profile-verification-event',
        event,
      });

      reply.send({ status: 'OK' });
    }
  );

  const sendDMBodySchema = Type.Object({
    recipient_nostr_pubkey: Type.String(),
    dm: Type.String(),
    relay: Type.Optional(Type.String()),
  });

  fastify.post(
    '/send-dm',
    {
      schema: {
        body: sendDMBodySchema,
      },
    },
    async (request, reply) => {
      const { recipient_nostr_pubkey, dm, relay } = request.body as Static<
        typeof sendDMBodySchema
      >;

      fastify.queues.nostr.add(`send-dm`, {
        type: 'send-dm',
        data: {
          recipient_nostr_pubkey,
          dm,
          relay,
        },
      });

      reply.send({ status: 'OK' });
    }
  );
}
