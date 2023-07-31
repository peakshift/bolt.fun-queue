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
        author_name: Type.String(),
        author_nostr_pubkey: Type.Optional(Type.String()),
        tags: Type.Array(Type.String()),
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
      '/publish-profile-verification-to-nostr',
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
      '/new-comment-notification',
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

    const userRegisteredForTournamentBodySchema = Type.Object({
      user_id: Type.Number(),
      user_name: Type.String(),
      tournament_id: Type.Number(),
      email: Type.String(),
    });

    fastify.post(
      '/tournament/new-user-registered',
      {
        schema: {
          body: userRegisteredForTournamentBodySchema,
        },
      },
      async (request, reply) => {
        const { user_id, user_name, tournament_id, email } =
          request.body as Static<typeof userRegisteredForTournamentBodySchema>;

        fastify.queues.emails.add(`new-user-registered-in-tournament`, {
          type: 'new-user-registered-in-tournament',
          data: {
            user_id,
            user_name,
            tournament_id,
            email,
          },
        });

        reply.send({ status: 'OK' });
      }
    );

    const projectSubmittedToTournamentBodySchema = Type.Object({
      user_id: Type.Number(),
      project_id: Type.Number(),
      tournament_id: Type.Number(),
      track_id: Type.Number(),
    });

    fastify.post(
      '/tournament/new-project-submitted',
      {
        schema: {
          body: projectSubmittedToTournamentBodySchema,
        },
      },
      async (request, reply) => {
        const { user_id, project_id, tournament_id, track_id } =
          request.body as Static<typeof projectSubmittedToTournamentBodySchema>;

        fastify.queues.emails.add(`new-project-submitted-to-tournament`, {
          type: 'new-project-submitted-to-tournament',
          data: {
            project_id,
            user_id,
            tournament_id,
            track_id,
          },
        });

        reply.send({ status: 'OK' });
      }
    );
  });
}
