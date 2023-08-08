import axios from 'axios';
import { env } from '../../env';
import { Subscriber, EmailList, UpdateSubscriber } from './types';

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

  createOrUpdateSubscriber: async (
    email: string,
    name: string,
    extraData?: Record<string, any>
  ) => {
    const existingSubsrciber = await EmailService.getSubscriberByEmail(email);

    if (existingSubsrciber) {
      return EmailService.updateSubscriber(existingSubsrciber, {
        name,
        ...(extraData && { attribs: extraData }),
      });
    }

    return emailApiFetcher<Subscriber>('/api/subscribers', 'POST', {
      email,
      name,
      ...(extraData && { attribs: extraData }),
    });
  },

  updateSubscriber: async (
    subscriber: Subscriber,
    new_data: Partial<
      Pick<Subscriber, 'name' | 'email' | 'status' | 'lists' | 'attribs'>
    >
  ) => {
    const newLists = subscriber.lists
      .map((l) => l.id)
      .concat(new_data.lists?.map((l) => l.id) || []);

    const updatedSubscriber: UpdateSubscriber = {
      ...subscriber,
      ...new_data,
      lists: newLists,
    };

    await emailApiFetcher<boolean>(
      `/api/subscribers/${subscriber.id}`,
      'PUT',
      updatedSubscriber
    );

    return updatedSubscriber;
  },

  getAllLists: () => {
    return emailApiFetcher<{ results: EmailList[] }>('/api/lists', 'GET', {
      per_page: 'all',
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
