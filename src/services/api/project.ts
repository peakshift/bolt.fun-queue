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
    operationName: 'ProjectDetails',
    query: `query ProjectDetails($projectId: Int, $projectTag: String) {
                getProject(id: $projectId, tag: $projectTag) {
                    id
                    title
                    tagline
                    description
                    hashtag
                    cover_image
                    thumbnail_image
                    launch_status
                    lightning_address
                    votes_count
                    category {
                        id
                        icon
                        title
                    }
                    tags {
                        id
                        title
                    }
                }
          }`,
    variables: {
      projectId: id,
    },
  };

  const res = await axios.post<
    APIResponse<{
      getProject: Project;
    }>
  >(env.BF_SERVERLESS_SERVICE_URL + '/graphql', query);

  return res.data.data.getProject;
}
