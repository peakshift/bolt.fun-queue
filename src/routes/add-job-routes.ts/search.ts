import { FastifyInstance } from 'fastify';
import { Static, Type } from '@sinclair/typebox';

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
      // title: Type.String(),
      // body: Type.String(),
    }),
  }),
  Type.Object({
    type: Type.Literal('story'),
    action: Type.Literal('create'),
    data: Type.Object({
      id: Type.Number(),
      // title: Type.String(),
      // body: Type.String(),
    }),
  }),
]);

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
      // title: Type.String(),
      // description: Type.String(),
      // tags: Type.Array(Type.String()),
    }),
  }),
  Type.Object({
    type: Type.Literal('project'),
    action: Type.Literal('create'),
    data: Type.Object({
      id: Type.Number(),
      // title: Type.String(),
      // description: Type.String(),
      // tags: Type.Array(Type.String()),
    }),
  }),
]);

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
      // name: Type.String(),
      // bio: Type.String(),
      // jobTitle: Type.String(),
      // roles: Type.Array(Type.String()),
      // skills: Type.Array(Type.String()),
    }),
  }),
  Type.Object({
    type: Type.Literal('user'),
    action: Type.Literal('create'),
    data: Type.Object({
      id: Type.Number(),
      // name: Type.String(),
      // bio: Type.String(),
      // jobTitle: Type.String(),
      // roles: Type.Array(Type.String()),
      // skills: Type.Array(Type.String()),
    }),
  }),
]);

export const syncWithDBBodySchema = Type.Union([
  storyUpdateObjectSchema,
  projectUpdateObjectSchema,
  userUpdateObjectSchema,
]);

export type SyncWithSearchDBPayload = Static<typeof syncWithDBBodySchema>;

export default async function searchRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/sync-with-search-db',
    {
      schema: {
        body: syncWithDBBodySchema,
      },
    },
    async (request, reply) => {
      const payload = request.body as Static<typeof syncWithDBBodySchema>;

      fastify.queues.search.add('sync-with-search-db', payload);

      reply.send({ status: 'OK' });
    }
  );
}
