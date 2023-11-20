import { FastifyInstance } from 'fastify';
import { Type, Static } from '@sinclair/typebox';

export default async function aiRoutes(fastify: FastifyInstance) {
  const generateStoryOgSummaryBodySchema = Type.Object({
    story: Type.Object({
      id: Type.String(),
      title: Type.String(),
      body: Type.String(),
    }),
    callback_url: Type.String(),
  });

  fastify.post(
    '/generate-story-og-summary',
    {
      schema: {
        body: generateStoryOgSummaryBodySchema,
      },
    },
    async (request, reply) => {
      const { story, callback_url } = request.body as Static<
        typeof generateStoryOgSummaryBodySchema
      >;

      fastify.queues.ai.add(`generate-story-og-summary`, {
        type: 'generate-story-og-summary',
        data: {
          story,
          callback_url,
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
    '/new-project-submitted-to-tournament',
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

  const sendOTPBodySchema = Type.Object({
    email: Type.String(),
    otp: Type.String(),
  });

  fastify.post(
    '/send-otp',
    {
      schema: {
        body: sendOTPBodySchema,
      },
    },
    async (request, reply) => {
      const { email, otp } = request.body as Static<typeof sendOTPBodySchema>;

      fastify.queues.emails.add(`send-otp`, {
        type: 'send-otp',
        data: {
          email,
          otp,
        },
      });

      reply.send({ status: 'OK' });
    }
  );
}
