import {
  InputProfileURL,
  type ProfileDataResponse,
} from "@/utils/google-developer/defs";
import { analyzeHtml, analyzeTier } from "@/utils/google-developer/scrapper";
import { z } from "astro/zod";
import { ARR_URL_TO_MATCH, ERR_INVALID_URL } from "./constants";
// import chromium from "@sparticuz/chromium-min";

export let dataResponse: ProfileDataResponse = {
  error: undefined,
  data: undefined,
};

export const resetDataResponse = () => {
  dataResponse = {
    error: undefined,
    data: undefined,
  };
};

export const postHandler = async (request: Request) => {
  if (request.method === "POST") {
    try {
      const urlToMatch: RegExp[] = ARR_URL_TO_MATCH;

      const data = await request.formData();
      const profileUrl = data.get("profileUrl");

      const parsedInput = InputProfileURL.safeParse(profileUrl);

      if (!parsedInput.success) {
        throw parsedInput.error;
      }

      if (!urlToMatch.some((url) => url.test(parsedInput.data))) {
        throw new Error(ERR_INVALID_URL);
      }

      // !! FETCHER START HERE
      const resultHtml = await analyzeHtml(parsedInput.data);
      const resultTier = analyzeTier(resultHtml);
      // !! END OF FETCHER

      // !! Start of Checker

      // !! End of Checker

      dataResponse = {
        error: undefined,
        data: resultTier,
      };

      console.log(JSON.stringify(dataResponse, null, 2));
    } catch (err) {
      dataResponse.data = undefined;

      if (err instanceof z.ZodError) {
        dataResponse.error = err.issues[0].message;

        console.error(err.issues);
      } else if (err instanceof Error) {
        dataResponse.error = err.message;

        console.error(err.message);
      } else {
        console.error(err);
      }
    }
  }
};
