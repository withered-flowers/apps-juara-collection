import { z } from "astro/zod";

export const InputProfileURL = z.string().url();
