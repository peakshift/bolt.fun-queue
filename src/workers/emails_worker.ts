import { createWorker } from '../queue';
import EmailService from '../services/emails/email.service';

const EMAILS_TEMPLATES = {
  Tournament_Registeration: 4,
  Project_Submission: 5,
};

export const createEmailsWorker = (queueName = 'emails') =>
  createWorker<EmailsQueue['Job'], any, EmailsQueue['JobNames']>(
    queueName,
    async (job) => {
      const logger = job.log.bind(job);

      try {
        if (job.data.type === 'new-user-registered-in-tournament') {
          await handleNewUserRegisteredInTournament(job.data.data);
        }

        if (job.data.type === 'new-project-submitted-to-tournament') {
          await handleNewProjectSubmittedToTournament(job.data.data);
        }
      } catch (error) {
        console.log(error);
        logger(String(error));
        throw error;
      }
    }
  );

const handleNewUserRegisteredInTournament = async (
  data: GetQueueJobDataType<
    EmailsQueue,
    'new-user-registered-in-tournament'
  >['data']
) => {
  const { email, tournament_id, user_id, user_name } = data;

  // create a Subscriber object
  const createdSubsciber = await EmailService.createSubscriber(
    email,
    user_name,
    { user_id }
  );

  // add this object to the tournament's subscribers list
  await EmailService.addSubscriberToList(
    createdSubsciber.id,
    getListIdForTournament(tournament_id)
  );
  // send an email confirming participation to the user
  await EmailService.sendTransactionalEmail({
    subscriberId: createdSubsciber.id,
    templateId: EMAILS_TEMPLATES.Tournament_Registeration,
    data: {
      tournament_name: getTournamentName(tournament_id),
    },
  });
};

const handleNewProjectSubmittedToTournament = async (
  data: GetQueueJobDataType<
    EmailsQueue,
    'new-project-submitted-to-tournament'
  >['data']
) => {
  const { user_id, project_id, tournament_id, track_id } = data;
  // query the user's Subscriber object
  const subscriber = await EmailService.getSubscriberByUserId(user_id);
  if (!subscriber) throw new Error('Subscriber not found');
  // send an email confirming submission to the user
  await EmailService.sendTransactionalEmail({
    subscriberId: subscriber.id,
    templateId: EMAILS_TEMPLATES.Project_Submission,
    data: {
      tournament_name: getTournamentName(tournament_id),
      track_name: getTournamentTrackName(tournament_id, track_id),
    },
  });
  // add the user to the Track's subscribers list if doesn't exist
  await EmailService.addSubscriberToList(
    subscriber.id,
    getListIdForTournamentTrack(tournament_id, track_id)
  );
};

const TOURNAMENTS = [
  {
    id: 1010,
    name: 'Testing Hackathon',
    subsListId: 7,
    tracks: [
      {
        id: 1,
        name: 'Track 1',
        subsListId: 8,
      },
      {
        id: 2,
        name: 'Track 2',
        subsListId: 9,
      },
    ],
  },
  {
    id: 3,
    name: 'AI 4 All',
    subsListId: 10,
    tracks: [],
  },
];

function getListIdForTournament(tournamentId: number) {
  const tournament = TOURNAMENTS.find((t) => t.id === tournamentId);
  if (!tournament) {
    throw new Error('Tournament not found');
  }
  return tournament.subsListId;
}

function getTournamentName(tournamentId: number) {
  const tournament = TOURNAMENTS.find((t) => t.id === tournamentId);
  if (!tournament) {
    throw new Error('Tournament not found');
  }
  return tournament.name;
}

function getTournamentTrackName(tournamentId: number, trackId: number) {
  const tournament = TOURNAMENTS.find((t) => t.id === tournamentId);
  if (!tournament) {
    throw new Error('Tournament not found');
  }

  const track = tournament.tracks.find((t) => t.id === trackId);
  if (!track) {
    throw new Error('Track not found');
  }
  return track.name;
}

function getListIdForTournamentTrack(tournamentId: number, trackId: number) {
  const tournament = TOURNAMENTS.find((t) => t.id === tournamentId);
  if (!tournament) {
    throw new Error('Tournament not found');
  }
  const track = tournament.tracks.find((t) => t.id === trackId);
  if (!track) {
    throw new Error('Track not found');
  }
  return track.subsListId;
}
