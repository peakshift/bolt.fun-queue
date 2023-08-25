import { FastifyInstance } from 'fastify';
import { Type, Static } from '@sinclair/typebox';

export default async function emailsRoutes(fastify: FastifyInstance) {
  const userRegisteredForTournamentBodySchema = Type.Object({
    user_id: Type.Number(),
    user_name: Type.String(),
    tournament_id: Type.Number(),
    email: Type.String(),
  });

  fastify.post(
    '/new-user-registered-in-tournament',
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
}
