import { createWorker } from '../queue';
import 'websocket-polyfill';
import { getPublicKey, getEventHash, signEvent } from 'nostr-tools';
import { env } from '../env';
import { Event } from 'nostr-tools/event';
import axios from 'axios';
import { RelayPool } from 'nostr-relaypool';

const RELAYS = [
  'wss://nostr-pub.wellorder.net',
  'wss://nostr-relay.untethr.me',
  'wss://nostr.drss.io',
  'wss://relay.damus.io',
  'wss://nostr.swiss-enigma.ch',
];

export const createNostrWorker = (queueName = 'nostr') =>
  createWorker<NostrQueue['Job'], any, NostrQueue['JobNames']>(
    queueName,
    async (job) => {
      const logger = job.log.bind(job);

      if (job.data.type === 'create-story-root-event') {
        let relayPool = new RelayPool(RELAYS);

        const storyRootEvent = createStoryRootEvent({ ...job.data.story });

        try {
          await publishEvent(storyRootEvent, relayPool, {
            logger,
          });

          logger('Event published on Nostr successfully');

          if (job.data.callback_url) {
            await makeCallbackRequest(job.data.callback_url, {
              type: job.data.type,
              story_id: job.data.story.id,
              root_event_id: storyRootEvent.id,
            });
          }
        } catch (error) {
          console.log(error);
          throw error;
        } finally {
          relayPool.close();
        }
      }

      if (job.data.type === 'create-comment-event') {
        logger('Creating comment event');
      }
    }
  );

function createStoryRootEvent(story: {
  canonical_url: string;
  url: string;
  title: string;
  author_name: string;
  tags: string[];
}) {
  const pubKey = getPublicKey(env.BOLTFUN_NOSTR_PRIVATE_KEY);

  let event = {
    kind: 1,
    pubkey: pubKey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['r', story.canonical_url],
      ['client', 'makers.bolt.fun'],
      ['event_type', 'story-root-event'],
      ['t', 'buildonbitcoin'],
    ].concat(story.tags.map((tag) => ['t', tag.toLowerCase()])),
    content: `${story.title}

Have a read and join the conversation 👇
    
author: ${story.author_name.slice(0, 20)} #BuildOnBitcoin 
    
Read story: ${story.url}`,
  } as Event;

  event.id = getEventHash(event);
  event.sig = signEvent(event, env.BOLTFUN_NOSTR_PRIVATE_KEY);

  return event;
}

async function publishEvent(
  event: Event,
  relayPool: RelayPool,
  options?: Partial<{ logger: typeof console.log }>
) {
  const { logger = console.log } = options ?? {};

  const relaysUrls = Array.from(relayPool.relayByUrl.keys());

  return new Promise(async (resolve, reject) => {
    logger('publishing...');

    const publishTimeout = setTimeout(() => {
      return reject(
        `failed to publish event ${event.id!.slice(0, 5)}… to any relay.`
      );
    }, 8000);

    relayPool.publish(event, relaysUrls);

    const unsub = relayPool.subscribe(
      [
        {
          ids: [event.id!],
        },
      ],
      relaysUrls,
      (event, afterEose, url) => {
        clearTimeout(publishTimeout);
        logger(`event ${event.id!.slice(0, 5)}… published to ${url}.`);
        return resolve(`event ${event.id.slice(0, 5)}… published to ${url}.`);
      }
    );
  });
}

async function makeCallbackRequest(
  url: string,
  data: string | Record<any, any>
) {
  return axios.post(url, data, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(
        `${env.BF_SERVERLESS_SERVICE_USERNAME}:${env.BF_SERVERLESS_SERVICE_PASS}`
      ).toString('base64')}`,
    },
  });
}
