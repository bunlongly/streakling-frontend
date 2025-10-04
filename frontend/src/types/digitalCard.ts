export type CardStatus = 'STUDENT' | 'GRADUATE' | 'WORKING';
export type PublishStatus = 'DRAFT' | 'PRIVATE' | 'PUBLISHED';

export type SocialPlatform =
  | 'TWITTER'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'LINKEDIN'
  | 'TIKTOK'
  | 'YOUTUBE'
  | 'GITHUB'
  | 'PERSONAL'
  | 'OTHER';

export type SocialAccount = {
  id: string;
  platform: SocialPlatform;
  handle: string | null;
  url: string | null;
  label: string | null;
  isPublic: boolean;
  sortOrder: number;
};

export type DigitalCard = {
  id: string;
  userId: string;
  slug: string;
  firstName: string;
  lastName: string;
  appName: string;
  status: CardStatus;
  role: string;
  shortBio: string;

  company: string | null;
  university: string | null;
  country: string | null;
  religion: string | null;
  phone: string | null;

  // visibility flags
  showPhone: boolean;
  showReligion: boolean;
  showCompany: boolean;
  showUniversity: boolean;
  showCountry: boolean;

  avatarKey: string | null;
  bannerKey: string | null;

  publishStatus: PublishStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;

  // NEW: socials
  socials: SocialAccount[];
};

export type UpsertCardInput = {
  slug: string;
  firstName: string;
  lastName: string;
  appName: string;
  status: CardStatus;
  role: string;
  shortBio: string;

  company?: string | null;
  university?: string | null;
  country?: string | null;
  religion?: string | null;
  phone?: string | null;

  showPhone?: boolean;
  showReligion?: boolean;
  showCompany?: boolean;
  showUniversity?: boolean;
  showCountry?: boolean;

  avatarKey?: string | null;
  bannerKey?: string | null;

  publishStatus?: PublishStatus;

  // NEW: socials on create/update (backend replaces if provided)
  socials?: Array<{
    id?: string;
    platform: SocialPlatform;
    handle?: string;
    url?: string;
    label?: string;
    isPublic?: boolean;
    sortOrder?: number;
  }>;
};
