import chromium from "@sparticuz/chromium-min";
import { chromium as playwright } from "playwright-core";
import {
  DATE_RANGE,
  GDEV_PROFILE_AVATAR,
  GDEV_PROFILE_BADGES,
  GDEV_PROFILE_NAME,
  LIST_OF_BADGES,
  TIERS,
} from "./config";
import type { Badge, EligibleProfile, Profile } from "./defs";

export const analyzeHtml = async (htmlString: string): Promise<Profile> => {
  const browser = await playwright.launch({
    args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
    headless: true,
    executablePath: await chromium.executablePath(
      "https://github.com/Sparticuz/chromium/releases/download/v119.0.0/chromium-v119.0.0-pack.tar",
    ),
  });

  // const browser = await playwright.launch({
  //   args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
  //   headless: true,
  // });

  const page = await browser.newPage();

  await page.goto(htmlString, {
    timeout: 10000,
  });

  const [elementProfileAvatar, elementProfileName, elementProfileBadges] =
    await Promise.all([
      page.waitForSelector(GDEV_PROFILE_AVATAR),
      page.waitForSelector(GDEV_PROFILE_NAME),
      page.waitForSelector(GDEV_PROFILE_BADGES),
    ]);

  const dataProfileAvatar = (
    (await elementProfileAvatar.getAttribute("style")) ?? ""
  ).replace(/background-image:url\(|\)/g, "");

  const dataProfileName = (await elementProfileName.textContent()) ?? "";

  const dataProfileBadges = await elementProfileBadges.$$(".badge");
  let arrProfileBadges: Badge[] = [];

  for (let i = 0; i < dataProfileBadges.length; i++) {
    const dataProfileBadge = dataProfileBadges[i];
    const dataProfileBadgeUrl =
      await dataProfileBadge.getAttribute("badge-url");
    const dataProfileBadgeTitle = await (
      await dataProfileBadge.$(".badge-title")
    )?.textContent();
    const dataProfileBadgeDate = await (
      await dataProfileBadge.$(".badge-date")
    )?.textContent();
    const dataProfileBadgeIconUrl = await (
      await dataProfileBadge.$(".badge-icon > img")
    )?.getAttribute("src");

    if (
      dataProfileBadgeUrl &&
      dataProfileBadgeTitle &&
      dataProfileBadgeDate &&
      dataProfileBadgeIconUrl
    ) {
      arrProfileBadges.push({
        title: dataProfileBadgeTitle,
        date: new Date(dataProfileBadgeDate),
        badgeUrl: dataProfileBadgeUrl,
        badgeIconUrl: dataProfileBadgeIconUrl,
      });
    }
  }

  await browser.close();

  return {
    avatar: dataProfileAvatar,
    name: dataProfileName,
    badges: arrProfileBadges,
  };
};

export const analyzeTier = (profile: Profile): EligibleProfile => {
  const { badges } = profile;

  // Get the date range
  const startDate = new Date(DATE_RANGE[0]);
  const endDate = new Date(DATE_RANGE[1]);

  // Filter the badges by date range
  const eligibleBadges = badges.map((badge) => {
    const { date } = badge;

    return {
      ...badge,
      eligible:
        date >= startDate &&
        date <= endDate &&
        LIST_OF_BADGES.includes(badge.title),
    };
  });

  const totalEligibleBadges = eligibleBadges.filter(
    (badge) => badge.eligible,
  ).length;

  // Find the tier
  let tier = 0;

  for (let i = 0; i < TIERS.length; i++) {
    if (totalEligibleBadges >= TIERS[i]) {
      tier = i + 1;
    }
  }

  const eligibleProfile = {
    ...profile,
    badges: eligibleBadges.filter((badge) => badge.eligible),
    totalEligibleBadges,
    tier,
  };

  // Return the result to be processed
  return eligibleProfile;
};
