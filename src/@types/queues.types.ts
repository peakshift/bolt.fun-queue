type NostrQueue = {
  Job:
    | {
        type: 'create-story-root-event';
        story: {
          id: string;
          title: string;
          canonical_url: string;
          url: string;
          author_name: string;
          author_nostr_pubkey?: string;
          tags: string[];
        };
        callback_url?: string;
      }
    | {
        type: 'publish-profile-verification-event';
        event: {
          id: string;
          kind: number;
          content: string;
          sig: string;
          created_at: number;
          tags: string[][];
          pubkey: string;
        };
      }
    | {
        type: 'create-comment-event';
        comment: any;
      };
  JobNames: NostrQueue['Job']['type'];
};

type NotificationsQueue = {
  Job:
    | {
        type: 'new-comment';
        comment: {
          event_id: string;
          canonical_url: string;
          url: string;
          content: string;
          pubkey: string;
          story_id: string;
        };
        callback_url?: string;
      }
    | {
        type: 'new-story';
        story: {
          id: string;
          title: string;
          authorName: string;
          canonical_url: string;
          url: string;
        };
      };
  JobNames: NotificationsQueue['Job']['type'];
};
