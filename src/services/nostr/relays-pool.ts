import { Filter, SimplePool } from 'nostr-tools';
import { NostrEvent } from '../../@types/nostr.types';

export const DEFAULT_RELAYS = [
  'wss://nostr.bolt.fun',
  'wss://nostr-pub.wellorder.net',
  'wss://nostr-relay.untethr.me',
  'wss://nostr.drss.io',
  'wss://relay.damus.io',
  'wss://nostr.swiss-enigma.ch',
];

export class RelayPool {
  pool: SimplePool;
  relays: string[];

  constructor(relaysUrls?: string[], config?: { useDefaultRelays?: boolean }) {
    this.relays = relaysUrls ?? [];

    if (config?.useDefaultRelays !== false)
      this.relays = [...this.relays, ...DEFAULT_RELAYS];

    this.pool = new SimplePool();
  }

  async publish(
    event: NostrEvent,
    options?: Partial<{ logger: typeof console.log; timout?: number }>
  ) {
    const { logger = console.log } = options ?? {};

    return new Promise(async (resolve, reject) => {
      logger('publishing...');

      const publishTimeout = setTimeout(() => {
        return reject(
          `failed to publish event ${event.id!.slice(0, 5)}… to any relay.`
        );
      }, options?.timout ?? 8000);

      const sub = this.pool.sub(this.relays, [
        {
          ids: [event.id!],
        },
      ]);

      sub.on('event', (event) => {
        clearTimeout(publishTimeout);
        logger(`event ${event.id!.slice(0, 5)}… published`);
        return resolve(`event ${event.id.slice(0, 5)}… published`);
      });

      Promise.allSettled(this.pool.publish(this.relays, event));
    });
  }

  getEvent(filter: Filter) {
    return this.pool.get(this.relays, filter);
  }

  close() {
    this.pool.close(this.relays);
  }
}
