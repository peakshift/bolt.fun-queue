import { SyncWithSearchDBPayload } from '../routes/add-job-routes.ts/search';

export type NostrQueue = {
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
      }
    | {
        type: 'send-dm';
        data: {
          recipient_nostr_pubkey: string;
          dm: string;
          relay?: string;
        };
      };
  JobNames: NostrQueue['Job']['type'];
};

export type NotificationsQueue = {
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

export type EmailsQueue = {
  Job:
    | {
        type: 'new-user-registered-in-tournament';
        data: {
          user_id: number;
          user_name: string;
          tournament_id: number;
          email: string;
        };
      }
    | {
        type: 'new-project-submitted-to-tournament';
        data: {
          tournament_id: number;
          track_id: number;
          project_id: number;
          user_id: number;
        };
      }
    | {
        type: 'send-otp';
        data: {
          email: string;
          otp: string;
        };
      }
    | {
        type: 'invite-judges-to-judging-round';
        data: {
          judges: {
            id: number;
            name: string;
            email: string;
          }[];
          round_url: string;
          tournament_id: number;
          tournament_title: string;
        };
      }
    | {
        type: 'subscribe-to-newsletter';
        data: {
          email: string;
          user_id: number;
          user_name: string;
        };
      };
  JobNames: EmailsQueue['Job']['type'];
};

export type SearchQueue = {
  Job: SyncWithSearchDBPayload;
  JobNames: 'sync-with-search-db';
};

export type AIQueue = {
  Job: {
    type: 'generate-story-og-summary';
    data: {
      story: {
        id: string;
        title: string;
        body: string;
      };
      callback_url: string;
    };
  };
  JobNames: AIQueue['Job']['type'];
};

export type GetQueueJobDataType<
  Queue extends { Job: { type: string }; JobNames: string },
  JobType extends Queue['JobNames'],
  _Jobs extends Queue['Job'] = Queue['Job']
> = _Jobs extends { type: JobType } ? _Jobs : never;
