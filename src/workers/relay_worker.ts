import { createWorker } from '../queue';
import { API } from '../services/api';
import { MeiliSearch } from 'meilisearch'
import { env } from '../env';

const client = new MeiliSearch({
    host: env.MEILISEARCH_HOST,
    apiKey: env.MEILISEARCH_API_KEY,
})

export const createRelayMeilisearchWorker = (queueName = 'relay-meilisearch') =>
    createWorker<RelayMeilisearchQueue['Job'], any, RelayMeilisearchQueue['JobNames']>(
        queueName,
        async (job) => {
            const logger = job.log.bind(job);

            const relayPool = createRelaysPool();

        }
    );