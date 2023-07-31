export type Subscriber = {
  id: number;
  uuid: string;
  email: string;
  name: string;
  attribs: Record<string, any>;
  status: string;
  lists: number[];
  created_at: string;
  updated_at: string;
};
