import { createWorker } from '../queue';
import 'websocket-polyfill';
import { env } from '../env';
import axios from 'axios';
import { nip04, getPublicKey, getEventHash, getSignature } from 'nostr-tools';
import { NostrQueue } from '../@types/queues.types';
import { NostrEvent, UnsignedNostrEvent } from '../@types/nostr.types';
import { RelayPool } from '../services/nostr';

export const createNostrWorker = (queueName = 'nostr') =>
  createWorker<NostrQueue['Job'], any, NostrQueue['JobNames']>(
    queueName,
    async (job) => {
      const logger = job.log.bind(job);

      let relayPool = new RelayPool();

      try {
        if (job.data.type === 'create-story-root-event') {
          const storyRootEvent = createStoryRootEvent({ ...job.data.story });

          await relayPool.publish(storyRootEvent, {
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
          await relayPool.publish(job.data.event, {
            logger,
          });
        }

        if (job.data.type === 'send-dm') {
          const { recipient_nostr_pubkey, dm, relay } = job.data.data;
          if (relay) {
            relayPool = new RelayPool([relay]);
          }
          const event = await createDMEvent(dm, recipient_nostr_pubkey);

          await relayPool.publish(event, {
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

  const sig = getSignature(baseEvent, env.BOLTFUN_NOSTR_PRIVATE_KEY);

  return {
    ...baseEvent,
    id: getEventHash(baseEvent),
    sig,
  } as NostrEvent;
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

async function createDMEvent(message: string, recipientPubkey: string) {
  const encryptedContent = await encrypteMessage(
    message,
    env.BOLTFUN_NOSTR_PRIVATE_KEY,
    recipientPubkey
  );

  const myPubkey = getPublicKey(env.BOLTFUN_NOSTR_PRIVATE_KEY);

  const baseEvent = {
    content: encryptedContent,
    created_at: Math.round(Date.now() / 1000),
    kind: 4,
    tags: [['p', recipientPubkey]],
    pubkey: myPubkey,
  } as UnsignedNostrEvent;

  const sig = await getSignature(baseEvent, env.BOLTFUN_NOSTR_PRIVATE_KEY);

  const id = getEventHash(baseEvent);

  const event = {
    ...baseEvent,
    sig,
    id,
  } as NostrEvent;

  return event;
}

function encrypteMessage(
  message: string,
  ourPrvkey: string,
  theirPubkey: string
) {
  return nip04.encrypt(ourPrvkey, theirPubkey, message);
}
