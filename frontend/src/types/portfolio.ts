export type VideoPlatform =
  | 'TIKTOK'
  | 'YOUTUBE'
  | 'TWITTER'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'LINKEDIN'
  | 'GITHUB'
  | 'PERSONAL'
  | 'OTHER';

export type PortfolioImage = {
  id?: string;
  key: string;
  url: string;
  sortOrder?: number;
};

export type PortfolioVideo = {
  id?: string;
  platform: VideoPlatform;
  url: string;
  description?: string;
  thumbnailUrl?: string;
};

export type Portfolio = {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  mainImageKey?: string | null;
  tags?: string[] | null;
  subImages: PortfolioImage[];
  videoLinks: PortfolioVideo[];
  createdAt: string;
  updatedAt: string;
};

export type CreatePortfolioInput = {
  title: string;
  description?: string;
  mainImageKey?: string;
  subImages?: PortfolioImage[];
  videoLinks?: PortfolioVideo[];
  tags?: string[];
};

export type UpdatePortfolioInput = Partial<CreatePortfolioInput>;
