import axios from 'axios';
import { env } from '../../env';
import { APIResponse } from './helpers';

type Tournament = {
  id: number;
  title: string;
  tracks: { id: number; title: string }[];
};

export async function getById(id: number) {
  const query = {
    operationName: 'GetTournamentQuery',
    query: `query GetTournamentQuery($idOrSlug: String!) {
            getTournamentById(idOrSlug: $idOrSlug) {
              id
              title
              tracks {
                id
                title
              }
            }
          }`,
    variables: {
      idOrSlug: id.toString(),
    },
  };

  const res = await axios.post<
    APIResponse<{
      getTournamentById: Tournament;
    }>
  >(env.BF_SERVERLESS_SERVICE_URL + '/graphql', query);

  return res.data.data.getTournamentById;
}
