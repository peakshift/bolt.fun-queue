import axios from 'axios';
import { env } from '../../env';
import { Subscriber } from './types';

const EmailService = {
  getSubscriberByEmail: async (email: string) => {
    const existingEmails = await emailApiFetcher<{ results: Subscriber[] }>(
      '/api/subscribers',
      'GET',
      {
        query: `subscribers.email = '${email}'`,
      }
    );

    if (existingEmails.results.length > 0) return existingEmails.results[0];

    return null;
  },
  getSubscriberByUserId: async (userId: number) => {
    const existingEmails = await emailApiFetcher<{ results: Subscriber[] }>(
      '/api/subscribers',
      'GET',
      {
        query: `(subscribers.attribs->>'user_id')::INT= ${userId}`,
      }
    );

    if (existingEmails.results.length > 0) return existingEmails.results[0];

    return null;
  },

  createSubscriber: async (
    email: string,
    name: string,
    extraData?: Record<string, any>
  ) => {
    const existingEmail = await EmailService.getSubscriberByEmail(email);

    if (existingEmail) return existingEmail;

    return emailApiFetcher<Subscriber>('/api/subscribers', 'POST', {
      email,
      name,
      ...(extraData && { attribs: extraData }),
    });
  },

  addSubscriberToList: (subscriberId: number, listId: number) => {
    return emailApiFetcher('/api/subscribers/lists', 'PUT', {
      ids: [subscriberId],
      action: 'add',
      target_list_ids: [listId],
      status: 'confirmed',
    });
  },

  sendTransactionalEmail: ({
    email,
    subscriberId,
    templateId,
    data = {},
  }: {
    email?: string;
    subscriberId?: number;
    templateId: number;
    data?: Record<string, any>;
  }) => {
    if (!email && !subscriberId)
      throw new Error('Either email or subscriberId must be provided');
    return emailApiFetcher('/api/tx', 'POST', {
      ...(email && { email }),
      ...(subscriberId && { subscriber_id: subscriberId }),
      template_id: templateId,
      data: data,
    });
  },
};

async function emailApiFetcher<ResponseType = any>(
  url: string,
  method: 'POST' | 'PUT' | 'GET' | 'DELETE',
  data?: any
) {
  const res = await axios({
    url: env.EMAILS_SERVICE_URL + url,
    method,
    ...(method === 'GET' ? { params: data } : { data }),
    headers: {
      Authorization: 'Basic ' + getAuthHeader(),
    },
  });
  return res.data.data as ResponseType;
}

function getAuthHeader() {
  return Buffer.from(
    `${env.EMAILS_SERVICE_USERNAME}:${env.EMAILS_SERVICE_PASSWORD}`
  ).toString('base64');
}

export default EmailService;
