import { z } from "astro/zod";

export interface Quest {
  imageUrl: string;
  title: string;
  date: Date;
}

export interface EligibleQuest extends Quest {
  eligible: boolean;
}

export interface Profile {
  name: string;
  quests: Quest[];
}

export interface EligibleProfile extends Profile {
  quests: EligibleQuest[];
  totalEligibleQuests: number;
  tier: number;
}

export type ProfileDataResponse = {
  error?: string;
  data?: EligibleProfile;
};

export const InputProfileURL = z.string().url();
