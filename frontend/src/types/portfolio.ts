// src/types/portfolio.ts

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

/* ===== Atomic pieces ===== */

export type PortfolioImage = {
  id: string;
  portfolioId: string;
  key: string;
  url: string;
  sortOrder?: number | null;
};

export type PortfolioVideo = {
  id: string;
  portfolioId: string;
  platform: SocialPlatform;
  url: string;
  description?: string | null;
};

export type PortfolioProjectImage = {
  id: string;
  projectId: string;
  key: string;
  url: string;
  sortOrder?: number | null;
};

export type PortfolioProjectVideo = {
  id: string;
  projectId: string;
  platform: SocialPlatform;
  url: string;
  description?: string | null;
};

export type PortfolioProject = {
  id: string;
  portfolioId: string;
  title: string;
  description?: string | null;
  mainImageKey?: string | null;
  tags?: string[] | null;
  createdAt: string;
  updatedAt: string;
  subImages?: PortfolioProjectImage[];
  videoLinks?: PortfolioProjectVideo[];
};

/* ===== NEW: About / Experience / Education ===== */

export type PortfolioAbout = {
  firstName?: string;
  lastName?: string;
  role?: string;
  shortBio?: string;
  company?: string;
  university?: string;
  country?: string;
  avatarKey?: string;
  bannerKey?: string;
} | null;

export type PortfolioExperience = {
  id: string;
  portfolioId: string;
  company: string;
  role: string;
  location?: string | null;
  startDate?: string | null; // strings in FE
  endDate?: string | null;
  current?: boolean;
  summary?: string | null;
};

export type PortfolioEducation = {
  id: string;
  portfolioId: string;
  school: string;
  degree?: string | null;
  field?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  summary?: string | null;
};

/* ===== Entity ===== */

export type Portfolio = {
  id: string;
  userId: string;

  slug: string;

  title: string;
  description?: string | null;
  mainImageKey?: string | null;
  tags?: string[] | null;

  // NEW
  about?: PortfolioAbout;

  publishStatus: PublishStatus;
  publishedAt?: string | null;

  createdAt: string;
  updatedAt: string;

  subImages?: PortfolioImage[];
  videoLinks?: PortfolioVideo[];
  projects?: PortfolioProject[];

  // NEW
  experiences?: PortfolioExperience[];
  educations?: PortfolioEducation[];

  // NEW (provenance; readonly for FE)
  sourceCardId?: string | null;
  sourceCardSnapshot?: {
    firstName?: string;
    lastName?: string;
    role?: string;
    shortBio?: string;
    company?: string;
    university?: string;
    country?: string;
    avatarKey?: string;
    bannerKey?: string;
  } | null;
};

/* ========= Inputs ========= */

export type CreatePortfolioInput = {
  slug?: string;

  title: string;
  description?: string;
  mainImageKey?: string;
  tags?: string[];

  publishStatus?: PublishStatus; // server defaults to DRAFT

  subImages?: Array<{ key: string; url: string; sortOrder?: number }>;
  videoLinks?: Array<{
    platform: SocialPlatform;
    url: string;
    description?: string;
  }>;

  projects?: Array<{
    title: string;
    description?: string;
    mainImageKey?: string;
    tags?: string[];
    subImages?: Array<{ key: string; url: string; sortOrder?: number }>;
    videoLinks?: Array<{
      platform: SocialPlatform;
      url: string;
      description?: string;
    }>;
  }>;

  // NEW
  about?: {
    firstName?: string;
    lastName?: string;
    role?: string;
    shortBio?: string;
    company?: string;
    university?: string;
    country?: string;
    avatarKey?: string;
    bannerKey?: string;
  };

  // keep as strings that match <input type="date">
  experiences?: Array<{
    company: string;
    role: string;
    location?: string;
    startDate?: string; // "YYYY-MM-DD"
    endDate?: string; // "YYYY-MM-DD"
    current?: boolean;
    summary?: string;
  }>;

  educations?: Array<{
    school: string;
    degree?: string;
    field?: string;
    startDate?: string; // "YYYY-MM-DD"
    endDate?: string; // "YYYY-MM-DD"
    summary?: string;
  }>;

  // convenience for server prefill/snapshot
  prefillFromCardId?: string;
};

export type UpdatePortfolioInput = Partial<CreatePortfolioInput>;
