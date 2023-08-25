import { createWorker } from '../queue';
import { API } from '../services/api';
import { MeiliSearch } from 'meilisearch';
import { env } from '../env';
import { SearchQueue } from '../@types/queues.types';

const client = new MeiliSearch({
  host: env.MEILISEARCH_HOST,
  apiKey: env.MEILISEARCH_API_KEY,
});

const typeToIndexName = {
  story: 'Stories',
  user: 'Users',
  project: 'Projects',
};

export const createSearchWorker = (queueName = 'search') =>
  createWorker<SearchQueue['Job'], any, SearchQueue['JobNames']>(
    queueName,
    async (job) => {
      const logger = job.log.bind(job);
      try {
        const objectType = job.data.type; // "story" | "project" | "user"
        const index = typeToIndexName[objectType];
        const action = job.data.action; // "delete" | "update" | "create"
        const id = job.data.data.id; // number

        switch (action) {
          case 'create':
          case 'update':
            await client.index(index).addDocuments([job.data.data]);
            break;
          case 'delete':
            await client.index(index).deleteDocument(id);
        }
      } catch (error) {
        console.log(error);
        throw error;
      }
    }
  );
