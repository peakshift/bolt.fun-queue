export type Subscriber = {
  id: number;
  uuid: string;
  email: string;
  name: string;
  attribs: Record<string, any>;
  status: string;
  lists: SubscriberList[];
  created_at: string;
  updated_at: string;
};

export type CreateSubscriber = Pick<
  Subscriber,
  'name' | 'email' | 'attribs'
> & { lists: number[] };
export type UpdateSubscriber = CreateSubscriber & Pick<Subscriber, 'id'>;

export type SubscriberList = {
  subscription_status: 'unconfirmed' | 'confirmed';
  subscription_created_at: string;
  subscription_updated_at: string;
} & EmailList;

export type EmailList = {
  id: number;
  uuid: string;
  name: string;
  optin: string;
  type: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};
