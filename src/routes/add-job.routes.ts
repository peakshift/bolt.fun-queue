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

    const syncWithEmailsDBBodySchema = Type.Object({
      user_id: Type.Number(),
      user_name: Type.String(),
      tournament_id: Type.Number(),
      email: Type.String(),
    });

    const storyUpdateObjectSchema = Type.Union([
      Type.Object({
        type: Type.Literal('story'),
        action: Type.Literal('delete'),
        data: Type.Object({
          id: Type.Number(),
        }),
      }),
      Type.Object({
        type: Type.Literal('story'),
        action: Type.Literal('update'),
        data: Type.Object({
          id: Type.Number(),
          title: Type.String(),
          body: Type.String(),
        }),
      }),
      Type.Object({
        type: Type.Literal('story'),
        action: Type.Literal('create'),
        data: Type.Object({
          id: Type.Number(),
          title: Type.String(),
          body: Type.String(),
        }),
      }),
    ]);

    type ProjectUpdateObject =
      | {
          type: 'project';
          action: 'delete';
          data: {
            id: number;
          };
        }
      | {
          type: 'project';
          action: 'update';
          data: {
            id: number;
            title: string;
            description: string;
            tags: string[];
          };
        }
      | {
          type: 'project';
          action: 'create';
          data: {
            id: number;
            title: string;
            description: string;
            tags: string[];
          };
        };

    const projectUpdateObjectSchema = Type.Union([
      Type.Object({
        type: Type.Literal('project'),
        action: Type.Literal('delete'),
        data: Type.Object({
          id: Type.Number(),
        }),
      }),
      Type.Object({
        type: Type.Literal('project'),
        action: Type.Literal('update'),
        data: Type.Object({
          id: Type.Number(),
          title: Type.String(),
          description: Type.String(),
          tags: Type.Array(Type.String()),
        }),
      }),
      Type.Object({
        type: Type.Literal('project'),
        action: Type.Literal('create'),
        data: Type.Object({
          id: Type.Number(),
          title: Type.String(),
          description: Type.String(),
          tags: Type.Array(Type.String()),
        }),
      }),
    ]);

    type UserUpdateObject =
      | {
          type: 'user';
          action: 'delete';
          data: {
            id: number;
          };
        }
      | {
          type: 'user';
          action: 'update';
          data: {
            id: number;
            name: string;
            bio: string;
            jobTitle: string;
            roles: string[];
            skills: string[];
          };
        }
      | {
          type: 'user';
          action: 'create';
          data: {
            id: number;
            name: string;
            bio: string;
            jobTitle: string;
            roles: string[];
            skills: string[];
          };
        };

    const userUpdateObjectSchema = Type.Union([
      Type.Object({
        type: Type.Literal('user'),
        action: Type.Literal('delete'),
        data: Type.Object({
          id: Type.Number(),
        }),
      }),
      Type.Object({
        type: Type.Literal('user'),
        action: Type.Literal('update'),
        data: Type.Object({
          id: Type.Number(),
          name: Type.String(),
          bio: Type.String(),
          jobTitle: Type.String(),
          roles: Type.Array(Type.String()),
          skills: Type.Array(Type.String()),
        }),
      }),
      Type.Object({
        type: Type.Literal('user'),
        action: Type.Literal('create'),
        data: Type.Object({
          id: Type.Number(),
          name: Type.String(),
          bio: Type.String(),
          jobTitle: Type.String(),
          roles: Type.Array(Type.String()),
          skills: Type.Array(Type.String()),
        }),
      }),
    ]);

    const syncWithDBBodySchema = Type.Union([
      storyUpdateObjectSchema,
      projectUpdateObjectSchema,
      userUpdateObjectSchema,
    ]);

    fastify.post(
      '/emails/sync-with-db',
      {
        schema: {
          body: syncWithDBBodySchema,
        },
      },
      async (request, reply) => {
        const { type, data, action } = request.body as Static<
          typeof syncWithDBBodySchema
        >;

        // fastify.queues.emails.add(`new-user-registered-in-tournament`, {
        //   type: 'new-user-registered-in-tournament',
        //   data: {
        //     user_id,
        //     user_name,
        //     tournament_id,
        //     email,
        //   },
        // });

        reply.send({ status: 'OK' });
      }
    );
  });
}
