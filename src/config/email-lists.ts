type TournamentEmailList = {
  id: number; // tournament id in the database
  name: string; // tournament name
  subsListId: number; // listmonk list id
  tracks: {
    id: number; // track id in the database
    name: string; // track name
    subsListId: number; // listmonk list id
  }[];
};

export const EMAILS_TEMPLATES = {
  TournamentRegistrationTemplateId: 4,
  ProjectSubmissionTemplateId: 5,
  OTPTemplateId: 9,
  InviteJudgesToJudgingRoundTemplateId: 10,
};
