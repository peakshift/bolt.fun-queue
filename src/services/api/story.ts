import axios from 'axios';
import { env } from '../../env';
import { APIResponse } from './helpers';

type Project = {
  id: number;
  title: string;
  tagline: string;
  description: string;
  hashtag: string;
  cover_image: string;
  thumbnail_image: string;
  launch_status: string;
  lightning_address: string;
  votes_count: number;
  category: {
    id: number;
    icon: string;
    title: string;
  };
  tags: {
    id: number;
    title: string;
  }[];
};

export async function getById(id: number) {
  const query = {
    operationName: 'PostDetails',
    query: `query PostDetails($id: Int!, $type: POST_TYPE!) {
      getPostById(id: $id, type: $type) {
        ... on Story {
          id
          title
          createdAt
          author {
            id
            name
            avatar
            join_date 
          }
          body
          tags { 
            title
          }
          votes_count
          type
          cover_image
          is_published
          nostr_event_id
          project {
            id
            title 
            hashtag
          }
        }
      }
    }`,
    variables: {
      id,
      type: 'Story',
    },
  };

  const res = await axios.post<
    APIResponse<{
      getPostById: Project;
    }>
  >(env.BF_SERVERLESS_SERVICE_URL + '/graphql', query);

  return res.data.data.getPostById;
}
