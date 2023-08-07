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

export const TOURNAMENTS_LISTS: TournamentEmailList[] = [
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
  {
    id: 9,
    name: 'Nostrasia',
    subsListId: 12,
    tracks: [
      {
        id: 10,
        name: 'Builder’s Track - Reimagine Nostr',
        subsListId: 13,
      },
      {
        id: 11,
        name: 'Marketplaces & Value4Value',
        subsListId: 14,
      },
      {
        id: 12,
        name: 'Empower Communities',
        subsListId: 15,
      },
    ],
  },
];

export const EMAILS_TEMPLATES = {
  TournamentRegistrationTemplateId: 4,
  ProjectSubmissionTemplateId: 5,
};
