import { RelayPool } from 'nostr-relaypool';
import { NostrToolsEventWithId } from 'nostr-relaypool/event';

export const DEFAULT_RELAYS = [
  'wss://nostr-pub.wellorder.net',
  'wss://nostr-relay.untethr.me',
  'wss://nostr.drss.io',
  'wss://relay.damus.io',
  'wss://nostr.swiss-enigma.ch',
];

export function createRelaysPool(
  relaysUrls?: string[],
  config: { useDefaultRelays?: boolean } = {}
) {
  const relays = (relaysUrls ?? []).concat(
    config.useDefaultRelays ? DEFAULT_RELAYS : []
  );

  return new RelayPool(relays);
}

export function publishNostrEvent(
  event: NostrToolsEventWithId,
  relayPool: RelayPool,
  options?: Partial<{ logger: typeof console.log; timout?: number }>
) {
  const { logger = console.log } = options ?? {};

  const relaysUrls = Array.from(relayPool.relayByUrl.keys());

  return new Promise(async (resolve, reject) => {
    logger('publishing...');

    const publishTimeout = setTimeout(() => {
      return reject(
        `failed to publish event ${event.id!.slice(0, 5)}… to any relay.`
      );
    }, options?.timout ?? 8000);

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

type NostrProfile = {
  pubkey: string;
  name: string;
  image: string;
  about: string | null;
  link: string;
  nip05?: string | null;
  lightning_address?: string | null;
  boltfun_id?: number;
};

export function getUserByNostrPubkey(pubkey: string, relayPool: RelayPool) {
  const relaysUrls = Array.from(relayPool.relayByUrl.keys());

  return new Promise<Partial<NostrProfile> | null>(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      return resolve(null);
    }, 8000);

    const unsub = relayPool.subscribe(
      [
        {
          kinds: [0],
          authors: [pubkey],
        },
      ],
      relaysUrls,
      (event, afterEose, url) => {
        clearTimeout(timeout);
        const userData = JSON.parse(event.content) as Partial<NostrProfile>;
        unsub();
        return resolve(userData);
      }
    );
  });
}
