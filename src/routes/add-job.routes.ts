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
}

type Jobs =
  | {
      name: 'publish-story-to-nostr';
      storyData: any;
    }
  | {
      name: 'send-notifications-new-story';
      storyData: {};
    }
  | {
      name: 'send-notifications-new-comment';
      commentData: {};
    };
