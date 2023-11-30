import { parseFromString } from "dom-parser";

import {
  CSB_PROFILE_BADGES,
  CSB_PROFILE_NAME,
  CSB_QUEST_BADGE,
  CSB_QUEST_DAY_OF_COMPLETION,
  CSB_QUEST_NAME,
  DATE_RANGE,
  LIST_OF_QUESTS,
  TIERS,
} from "./config";

import type { Profile, EligibleProfile } from "./defs";

export const analyzeHtml = (htmlString: string): Profile => {
  const dom = parseFromString(htmlString);

  const profileName = dom
    .getElementsByClassName(CSB_PROFILE_NAME)[0]
    .textContent.trim();

  // Fetch all the "profile-badge" , will return Node[]
  const badges = dom.getElementsByClassName(CSB_PROFILE_BADGES);

  // ("ql-title-medium l-mts"), will return String[]
  const questNames = badges.map((badge) =>
    badge.getElementsByClassName(CSB_QUEST_NAME)[0].textContent.trim(),
  );

  // ("badge-image") > img, will return String[]
  const questImages = badges.map((badge) => {
    const anchorImage = badge.getElementsByClassName(CSB_QUEST_BADGE)[0];
    const image = anchorImage.getElementsByTagName("img")[0];
    const imageUrl = image.getAttribute("src");

    return imageUrl;
  });

  // ("ql-body-medium l-mbs"), will return String[]
  const questDatesOfCompletions = badges.map((badge) => {
    const stringDate = badge
      .getElementsByClassName(CSB_QUEST_DAY_OF_COMPLETION)[0]
      .textContent.trim()
      .replace("Earned ", "");

    const date = new Date(stringDate);

    return date;
  });

  // Check if the length of titles and dates are equal
  if (
    questNames.length !== questDatesOfCompletions.length ||
    questNames.length !== questImages.length
  ) {
    throw new Error("Titles, dates, and images length are not equal");
  }

  // Combine the titles and dates into an Array of Object
  // { title: string, date: Date }[]
  const quests = questNames.map((title, index) => ({
    title,
    imageUrl: questImages[index],
    date: questDatesOfCompletions[index],
  }));

  // Return the result to be processed
  return {
    name: profileName,
    quests,
  };
};

export const analyzeTier = (profile: Profile): EligibleProfile => {
  const { quests } = profile;

  // Get the date range
  const startDate = new Date(DATE_RANGE[0]);
  const endDate = new Date(DATE_RANGE[1]);

  // Filter the quests by date range
  const eligibleQuests = quests.map((quest) => {
    const { date } = quest;

    return {
      ...quest,
      eligible:
        date >= startDate &&
        date <= endDate &&
        LIST_OF_QUESTS.includes(quest.title),
    };
  });

  const totalEligibleQuests = eligibleQuests.filter(
    (quest) => quest.eligible,
  ).length;

  // Find the tier
  let tier = 0;

  for (let i = 0; i < TIERS.length; i++) {
    if (totalEligibleQuests >= TIERS[i]) {
      tier = i + 1;
    }
  }

  const eligibleProfile = {
    ...profile,
    quests: eligibleQuests.filter((quest) => quest.eligible),
    totalEligibleQuests,
    tier,
  };

  // Return the result to be processed
  return eligibleProfile;
};
