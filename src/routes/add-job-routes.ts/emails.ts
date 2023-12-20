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

  const inviteJudgesToJudgingRoundSchema = Type.Object({
    judges: Type.Array(
      Type.Object({
        id: Type.Number(),
        name: Type.String(),
        email: Type.String(),
      })
    ),
    round_url: Type.String(),
    tournament_id: Type.Number(),
    tournament_title: Type.String(),
  });

  fastify.post(
    '/invite-judges-to-judging-round',
    {
      schema: {
        body: inviteJudgesToJudgingRoundSchema,
      },
    },
    async (request, reply) => {
      const { judges, round_url, tournament_id, tournament_title } =
        request.body as Static<typeof inviteJudgesToJudgingRoundSchema>;

      fastify.queues.emails.add(`invite-judges-to-judging-round`, {
        type: 'invite-judges-to-judging-round',
        data: { judges, round_url, tournament_id, tournament_title },
      });

      reply.send({ status: 'OK' });
    }
  );

  const subscribeToNewsletterSchema = Type.Object({
    email: Type.String(),
    user_id: Type.Optional(Type.Number()),
    user_name: Type.Optional(Type.String()),
  });

  fastify.post(
    '/subscribe-to-newsletter',
    {
      schema: {
        body: subscribeToNewsletterSchema,
      },
    },
    async (request, reply) => {
      const { email, user_id, user_name } = request.body as Static<
        typeof subscribeToNewsletterSchema
      >;

      fastify.queues.emails.add(`subscribe-to-newsletter`, {
        type: 'subscribe-to-newsletter',
        data: { email, user_id, user_name },
      });

      reply.send({ status: 'OK' });
    }
  );
}
