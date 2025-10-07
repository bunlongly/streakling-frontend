// src/types/profile.ts
export type PublicIndustry = { slug: string; name: string };

export type PublicProfile = {
  id: string;
  username: string | null;
  displayName: string;
  avatarKey: string | null;
  avatarUrl: string | null;
  bannerKey: string | null;
  industries: PublicIndustry[];
  showEmail: boolean;
  showReligion: boolean;
  showDateOfBirth: boolean;
  showPhone: boolean;
  showCountry: boolean;
  isOwner: boolean;

  // owner-only (may be present when isOwner=true)
  email?: string | null;
  country?: string | null;
  religion?: string | null;
  dateOfBirth?: string | null; // ISO string
  phone?: string | null;
};

export type ProfilesListResponse = {
  items: PublicProfile[];
  nextCursor: string | null;
};

export type MyOverviewResponse = {
  profile: PublicProfile & {
    isOwner: true;
    email: string | null;
    country: string | null;
    religion: string | null;
    dateOfBirth: string | null;
    phone: string | null;
  };
  stats: {
    digitalCardsCount: number;
    portfoliosCount: number;
  };
  recent: {
    digitalCards: Array<{
      id: string;
      slug: string;
      appName: string;
      publishStatus: 'DRAFT' | 'PRIVATE' | 'PUBLISHED';
      updatedAt: string;
      avatarKey: string | null;
      bannerKey: string | null;
    }>;
    portfolios: Array<{
      id: string;
      slug: string;
      title: string;
      publishStatus: 'DRAFT' | 'PRIVATE' | 'PUBLISHED';
      updatedAt: string;
      mainImageKey: string | null;
    }>;
  };
};

export type UpdateMyProfileInput = {
  username?: string;
  displayName?: string;
  email?: string;
  country?: string;
  religion?: string;
  dateOfBirth?: string; // yyyy-mm-dd
  phone?: string;

  avatarKey?: string | null;
  bannerKey?: string | null;

  showEmail?: boolean;
  showReligion?: boolean;
  showDateOfBirth?: boolean;
  showPhone?: boolean;
  showCountry?: boolean;

  // industry slugs
  industries?: string[];
};
