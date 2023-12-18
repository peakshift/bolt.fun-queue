import { EmailsQueue, GetQueueJobDataType } from '../@types/queues.types';
import { EMAILS_TEMPLATES, EMAIL_LISTS } from '../config';
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

        if (job.data.type === 'invite-judges-to-judging-round') {
          await handleInviteJudgesToJudgingRound(job.data.data);
        }

        if (job.data.type === 'subscribe-to-newsletter') {
          await handleSubscribeToNewsletter(job.data.data);
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

const handleInviteJudgesToJudgingRound = async (
  data: GetQueueJobDataType<
    EmailsQueue,
    'invite-judges-to-judging-round'
  >['data']
) => {
  const { judges, round_url, tournament_id, tournament_title } = data;

  if (!judges.length) return;

  const subscribers = await Promise.all(
    judges.map(async (judge) => {
      const subscriber = await EmailService.createOrUpdateSubscriber(
        judge.email,
        judge.name,
        { user_id: judge.id }
      );

      return subscriber;
    })
  );

  await Promise.all(
    subscribers.map(async (subscriber) => {
      const user_profile_url = `https://bolt.fun/profile/${subscriber.attribs?.user_id}`;
      const email = subscriber.email;

      await EmailService.sendTransactionalEmail({
        email,
        templateId: EMAILS_TEMPLATES.InviteJudgesToJudgingRoundTemplateId,
        data: {
          tournament_title,
          round_url,
          user_profile_url,
        },
      });
    })
  );
};

const handleSubscribeToNewsletter = async (
  data: GetQueueJobDataType<EmailsQueue, 'subscribe-to-newsletter'>['data']
) => {
  const { email, user_id, user_name } = data;

  // create a Subscriber object
  const subscriber = await EmailService.createOrUpdateSubscriber(
    email,
    user_name,
    { user_id }
  );

  // add this object to the newsletter subscribers list
  await EmailService.addSubscriberToList(
    subscriber.id,
    EMAIL_LISTS.NewsletterListId
  );

  // TODO: mabe send an email confirming subscription to the user?

  // await EmailService.sendTransactionalEmail({
  //   subscriberId: subscriber.id,
  //   templateId: EMAILS_TEMPLATES.NewsletterSubscriptionTemplateId,
  //   data: {
  //     user_name,
  //   },
  // });
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
