import {
  InputProfileURL,
  type ProfileDataResponse,
} from "@/utils/cloudskillsboost/defs";
import { analyzeHtml, analyzeTier } from "@/utils/cloudskillsboost/scrapper";
import { z } from "astro/zod";

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
      const data = await request.formData();
      const profileUrl = data.get("profileUrl");

      const parsedInput = InputProfileURL.safeParse(profileUrl);

      if (!parsedInput.success) {
        throw parsedInput.error;
      }

      // Fetcher
      const response = await fetch(parsedInput.data);
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error("Either Invalid URL or Profile not public yet");
      }
      // End of Fetcher

      // Parser
      const resultHtml = analyzeHtml(responseText);
      const resultTier = analyzeTier(resultHtml);

      dataResponse = {
        error: undefined,
        data: resultTier,
      };
      // End of Parser
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
