export type ChallengeStatus = 'OPEN' | 'CLOSED' | 'ARCHIVED';
export type PublishStatus = 'DRAFT' | 'PRIVATE' | 'PUBLISHED';
export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WINNER';

export type ChallengePrize = {
  id: string;
  challengeId: string;
  rank: number;
  label?: string | null;
  amountCents?: number | null;
  notes?: string | null;
};

export type ChallengeImage = {
  id: string;
  key: string;
  url: string;
  sortOrder: number;
};

export type Challenge = {
  id: string;
  userId: string;
  slug: string;
  title: string;
  description?: string | null;
  brandName?: string | null;
  brandLogoKey?: string | null;
  postingUrl?: string | null;
  targetPlatforms?: string[] | null; // stored as JSON
  goalViews?: number | null;
  goalLikes?: number | null;
  deadline?: string | null; // ISO from API
  publishStatus: PublishStatus;
  publishedAt?: string | null;
  status: ChallengeStatus;
  prizes: ChallengePrize[];
  images?: ChallengeImage[];
  nextSubmissionOrder: number;
  createdAt: string;
  updatedAt: string;

  // convenience from API
  isOwner?: boolean;
  postedOn?: string; // (publishedAt || createdAt)
};

export type ChallengePublicList = {
  items: Challenge[];
  nextCursor: string | null;
};

export type ChallengeImageInput = {
  key: string;
  url: string;
  sortOrder?: number;
};

export type CreateChallengeInput = {
  title: string;
  description?: string | null;
  brandName?: string | null;
  brandLogoKey?: string | null;
  postingUrl?: string | null;
  targetPlatforms?: string[] | null;
  goalViews?: number | null;
  goalLikes?: number | null;
  deadline?: string | null; // 'YYYY-MM-DD' or full ISO
  publishStatus?: PublishStatus;
  status?: ChallengeStatus;
  prizes?: Array<{
    rank: number;
    label?: string | null;
    amountCents?: number | null;
    notes?: string | null;
  }>;
  images?: ChallengeImageInput[]; // (max 6 enforced server-side)
};

export type UpdateChallengeInput = Partial<CreateChallengeInput>;

export type ChallengeSubmission = {
  id: string;
  challengeId: string;
  submitterId?: string | null;
  platform: string;
  linkUrl?: string | null;
  imageKey?: string | null;
  notes?: string | null;

  // snapshot fields from server
  submitterName?: string | null;
  submitterPhone?: string | null;
  submitterSocials?: Array<{
    platform: string;
    handle?: string | null;
    url?: string | null;
    label?: string | null;
  }>;

  submissionOrder: number;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateSubmissionInput = {
  platform: string;
  linkUrl?: string | null;
  imageKey?: string | null;
  notes?: string | null;
};
