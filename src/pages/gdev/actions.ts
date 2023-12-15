import { z } from "astro/zod";
import { ERR_INVALID_URL, ARR_URL_TO_MATCH } from "./constants";
import {
  InputProfileURL,
  type ProfileDataResponse,
} from "@/utils/google-developer/defs";
import { chromium as playwright, devices } from "playwright-core";
import chromium from "@sparticuz/chromium-min";
import {
  GDEV_PROFILE_AVATAR,
  GDEV_PROFILE_NAME,
} from "@/utils/google-developer/config";

import { Dom, parseFromString } from "dom-parser";

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

      // console.log(parsedInput.data);

      // const browser = await playwright.launch({
      //   args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      //   headless: true,
      //   // executablePath: await chromium.executablePath(
      //   //   "https://github.com/Sparticuz/chromium/releases/download/v119.0.0/chromium-v119.0.0-pack.tar",
      //   // ),
      // });

      const browser = await playwright.launch({
        headless: true,
      });

      const page = await browser.newPage();

      await page.goto(parsedInput.data, {
        timeout: 10000,
      });

      const [elementProfileAvatar, elementProfileName, elementProfileBadges] =
        await Promise.all([
          page.waitForSelector(GDEV_PROFILE_AVATAR),
          page.waitForSelector(GDEV_PROFILE_NAME),
          page.waitForSelector("#all-profile-badges-container"),
        ]);

      const dataProfileAvatar = (
        (await elementProfileAvatar.getAttribute("style")) ?? ""
      ).replace(/background-image:url\(|\)/g, "");

      const dataProfileName = await elementProfileName.textContent();

      // TODO: Need to change this async-ness
      const dataProfileBadges = await elementProfileBadges.$$(".badge");
      let arrProfileBadges: { title: string; date: string }[] = [];

      for (let i = 0; i < dataProfileBadges.length; i++) {
        const dataProfileBadge = dataProfileBadges[i];
        const dataProfileBadgeTitle = await (
          await dataProfileBadge.$(".badge-title")
        )?.textContent();
        const dataProfileBadgeDate = await (
          await dataProfileBadge.$(".badge-date")
        )?.textContent();

        if (dataProfileBadgeTitle && dataProfileBadgeDate) {
          arrProfileBadges.push({
            title: dataProfileBadgeTitle,
            date: dataProfileBadgeDate,
          });
        }
      }

      dataResponse = {
        error: undefined,
        data: {
          avatar: dataProfileAvatar,
          name: dataProfileName,
          badges: arrProfileBadges,
        },
      };

      console.log(JSON.stringify(dataResponse, null, 2));

      await browser.close();
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
