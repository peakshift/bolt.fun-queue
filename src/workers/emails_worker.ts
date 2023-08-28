import { EmailsQueue, GetQueueJobDataType } from '../@types/queues.types';
import { EMAILS_TEMPLATES } from '../config';
import { createWorker } from '../queue';
import { API } from '../services/api';
import EmailService from '../services/emails/email.service';

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

        if (job.data.type === 'send-otp') {
          await handleSendOtp(job.data.data.email, job.data.data.otp);
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
  const subscriber = await EmailService.createOrUpdateSubscriber(
    email,
    user_name,
    { user_id }
  );

  const tournamentListId = await getListIdForTournament(tournament_id);

  if (!tournamentListId)
    throw new Error(
      'No subscribers list found for this tournament. Please create one in the dashboard.'
    );

  // add this object to the tournament's subscribers list
  await EmailService.addSubscriberToList(subscriber.id, tournamentListId);

  const tournamentData = await API.tournament.getById(tournament_id);

  const tournament_name = tournamentData.title;

  // send an email confirming participation to the user
  await EmailService.sendTransactionalEmail({
    subscriberId: subscriber.id,
    templateId: EMAILS_TEMPLATES.TournamentRegistrationTemplateId,
    data: {
      tournament_name,
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

  const tournamentData = await API.tournament.getById(tournament_id);

  const tournament_name = tournamentData.title;
  const track_name = tournamentData.tracks.find(
    (t) => t.id === track_id
  )?.title;

  // send an email confirming submission to the user
  await EmailService.sendTransactionalEmail({
    subscriberId: subscriber.id,
    templateId: EMAILS_TEMPLATES.ProjectSubmissionTemplateId,
    data: {
      tournament_name,
      track_name,
    },
  });

  const tournamentTrackListId = await getListIdForTournamentTrack(track_id);

  if (!tournamentTrackListId)
    throw new Error(
      'No subscribers list found for this tournament track. Please create one in the dashboard.'
    );

  // add the user to the Track's subscribers list if doesn't exist
  await EmailService.addSubscriberToList(subscriber.id, tournamentTrackListId);
};

const handleSendOtp = async (email: string, otp: string) => {
  // send an email with the OTP to the user
  await EmailService.sendTransactionalEmail({
    email,
    templateId: EMAILS_TEMPLATES.OTPTemplateId,
    data: {
      otp,
    },
  });
};

async function getListIdForTournament(tournamentId: number) {
  const allLists = await EmailService.getAllLists();
  const found = allLists.results.find((list) =>
    list.tags.includes(`tournament-id:${tournamentId}`)
  );
  return found?.id;
}

async function getListIdForTournamentTrack(trackId: number) {
  const allLists = await EmailService.getAllLists();
  const found = allLists.results.find((list) =>
    list.tags.includes(`track-id:${trackId}`)
  );
  return found?.id;
}

function createTournamentList(tournamentId: number) {
  // create a list with tag: `tournament-id:${tournamentId}`
  // return list.id
}

function createTournamentTrackList(trackId: number) {
  // create a list with tag: `track-id:${trackId}`
  // return list.id
}
