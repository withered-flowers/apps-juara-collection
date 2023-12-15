import { z } from "astro/zod";

export interface Badge {
  title: string;
  date: Date;
  badgeUrl: string;
  badgeIconUrl: string;
}

export interface EligibleBadge extends Badge {
  eligible: boolean;
}

export interface Profile {
  avatar: string;
  name: string;
  badges: Badge[];
}

export interface EligibleProfile extends Profile {
  badges: EligibleBadge[];
  totalEligibleBadges: number;
  tier: number;
}

export type ProfileDataResponse = {
  error?: string;
  data?: EligibleProfile;
};

export const InputProfileURL = z.string().url();
