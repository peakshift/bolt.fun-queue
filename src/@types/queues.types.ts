type NostrQueue = {
  Job:
    | {
        type: 'create-story-root-event';
        story: {
          id: string;
          title: string;
          url: string;
        };
        callback_url?: string;
      }
    | {
        type: 'create-comment-event';
        comment: any;
      };
  JobNames: NostrQueue['Job']['type'];
};
