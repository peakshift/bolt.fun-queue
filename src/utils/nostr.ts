import { RelayPool } from '../services/nostr';

export const DEFAULT_RELAYS = [
  'wss://nostr-pub.wellorder.net',
  'wss://nostr-relay.untethr.me',
  'wss://relay.damus.io',
  'wss://nostr.swiss-enigma.ch',
  'wss://relay.primal.net',
];

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
  return relayPool.getEvent({
    kinds: [0],
    authors: [pubkey],
  }) as Promise<Partial<NostrProfile> | null>;
}
