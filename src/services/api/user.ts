import axios from 'axios';
import { env } from '../../env';
import { APIResponse } from './helpers';

type Profile = {
  id: number;
  name: string;
  avatar: string;
  join_date: string;
  role: string;
  jobTitle: string;
  lightning_address: string;
  bio: string;
  location: string;
  skills: {
    id: number;
    title: string;
  }[];
  roles: {
    id: number;
    title: string;
    icon: string;
    level: number;
  }[];
};

export async function getById(id: number) {
  const query = {
    operationName: 'Profile',
    query: `query Profile($profileId: Int!) {
        profile(id: $profileId) {
          id
          name
          avatar
          join_date
          role
          jobTitle
          lightning_address
          bio
          location
          skills {
            id
            title
          }
          roles {
            id
            title
            icon
            level
          }
        }
      }`,
    variables: {
      profileId: id,
    },
  };

  const res = await axios.post<
    APIResponse<{
      profile: Profile;
    }>
  >(env.BF_SERVERLESS_SERVICE_URL + '/graphql', query);

  return res.data.data.profile;
}
