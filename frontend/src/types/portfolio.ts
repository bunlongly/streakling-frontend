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

export type Portfolio = {
  id: string;
  userId: string;

  slug: string; // 👈 important

  title: string;
  description?: string | null;
  mainImageKey?: string | null;
  tags?: string[] | null;

  publishStatus: PublishStatus; // 👈 important
  publishedAt?: string | null; // 👈 important

  createdAt: string;
  updatedAt: string;

  subImages?: PortfolioImage[];
  videoLinks?: PortfolioVideo[];
  projects?: PortfolioProject[];
};

/* ========= Inputs ========= */

export type CreatePortfolioInput = {
  // server will ensure uniqueness if missing
  slug?: string;

  title: string;
  description?: string;
  mainImageKey?: string;
  tags?: string[];

  publishStatus?: PublishStatus; // default DRAFT on server

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
};

export type UpdatePortfolioInput = Partial<CreatePortfolioInput>;
