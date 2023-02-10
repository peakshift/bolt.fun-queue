import axios from 'axios';
import { nip19 } from 'nostr-tools';
import { env } from '../env';
import { createWorker } from '../queue';

export const createNotificationsWorker = (queueName = 'notifications') =>
  createWorker<NotificationsQueue['Job'], any, NotificationsQueue['JobNames']>(
    queueName,
    async (job) => {
      const logger = job.log.bind(job);

      if (job.data.type === 'new-comment') {
        const {
          comment: { pubkey, url, content },
        } = job.data;

        const npub = nip19.npubEncode(pubkey);
        const username = `${npub.slice(0, 8)}...${npub.slice(-4)}`;

        const notifBody = `New comment on story: ${url}
**${username}**: _"${
          content.slice(0, 40) + (content.length > 40 ? '...' : '')
        }"_`;

        await sendNotifications({ content: notifBody });

        logger('Notification send successfully');
      }

      if (job.data.type === 'new-story') {
      }
    }
  );

// function sendNewStoryNotification({ id, title, authorName }) {
//   const content = `**${authorName.slice(0, 15)}** published a new story:

//   _**${title}**_

//   https://makers.bolt.fun/story/${toSlug(title)}--${id}
//     `;

//   return sendNotifications({ content });
// }

function sendNotifications({ content }: { content: string }) {
  return Promise.all([notifyDiscord({ content })]);
}

function notifyDiscord({ content }: { content: string }) {
  if (!env.DISCORD_NOTIFICATIONS_WEBHOOK_URL) return;
  return axios.post(env.DISCORD_NOTIFICATIONS_WEBHOOK_URL, { content });
}
