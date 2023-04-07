import { createWorker } from '../queue';
import 'websocket-polyfill';
import { getPublicKey, getEventHash, signEvent } from 'nostr-tools';
import { env } from '../env';
import axios from 'axios';
import { createRelaysPool, publishNostrEvent } from '../utils/nostr';
import { NostrToolsEventWithId } from 'nostr-relaypool/event';

export const createNostrWorker = (queueName = 'nostr') =>
  createWorker<NostrQueue['Job'], any, NostrQueue['JobNames']>(
    queueName,
    async (job) => {
      const logger = job.log.bind(job);

      const relayPool = createRelaysPool();

      try {
        if (job.data.type === 'create-story-root-event') {
          const storyRootEvent = createStoryRootEvent({ ...job.data.story });

          await publishNostrEvent(storyRootEvent, relayPool, {
            logger,
          });

          if (job.data.callback_url) {
            await makeCallbackRequest(job.data.callback_url, {
              type: job.data.type,
              story_id: job.data.story.id,
              root_event_id: storyRootEvent.id,
            });
          }
        }

        if (job.data.type === 'publish-profile-verification-event') {
          await publishNostrEvent(job.data.event, relayPool, {
            logger,
          });
        }
      } catch (error) {
        console.log(error);
        throw error;
      } finally {
        relayPool.close();
      }
    }
  );

function createStoryRootEvent(story: {
  canonical_url: string;
  url: string;
  title: string;
  author_name: string;
  author_nostr_pubkey?: string;
  tags: string[];
}) {
  const pubkey = getPublicKey(env.BOLTFUN_NOSTR_PRIVATE_KEY);

  const tags = [
    ['r', story.canonical_url],
    ['client', 'bolt.fun'],
    ['event_type', 'story-root-event'],
    ['t', 'buildonbitcoin'],
  ].concat(story.tags.map((tag) => ['t', tag.toLowerCase()]));

  const pubkeyTagIndex = tags.length;

  if (story.author_nostr_pubkey) {
    tags.push(['p', story.author_nostr_pubkey]);
  }

  const content = `${story.title}

Have a read and join the conversation 👇
      
<author: ${
    story.author_nostr_pubkey
      ? `#[${pubkeyTagIndex}]`
      : story.author_name.slice(0, 20)
  }> #BuildOnBitcoin 
      
Read story: ${story.url}`;

  const baseEvent = {
    kind: 1,
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content,
  };

  return {
    ...baseEvent,
    id: getEventHash(baseEvent),
    sig: signEvent(baseEvent, env.BOLTFUN_NOSTR_PRIVATE_KEY),
  } as NostrToolsEventWithId;
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
