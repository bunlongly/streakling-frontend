export type CardStatus = 'STUDENT' | 'GRADUATE' | 'WORKING';
export type PublishStatus = 'DRAFT' | 'PUBLISHED';

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

  company?: string | null;
  university?: string | null;
  country?: string | null;
  religion?: string | null;
  phone?: string | null;

  // visibility flags
  showPhone: boolean;
  showReligion: boolean;
  showCompany: boolean;
  showUniversity: boolean;
  showCountry: boolean;

  avatarKey?: string | null;
  bannerKey?: string | null;

  publishStatus: PublishStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
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
};
