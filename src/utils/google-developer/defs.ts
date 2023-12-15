import { z } from "astro/zod";

export type ProfileDataResponse = {
  error?: string;
  data?: unknown;
};

export const InputProfileURL = z.string().url();
