import { siteConfig } from "./siteConfig";

export type Campaign = (typeof siteConfig.campaigns)[number];

/** Find a campaign by slug, or null if not found. */
export function getCampaign(slug: string): Campaign | null {
  return siteConfig.campaigns.find((c) => c.slug === slug) ?? null;
}

/** True when the campaign drop date has passed (or is not set). */
export function isCampaignLive(campaign: Campaign): boolean {
  if (!campaign.dropDate) return true;
  return new Date(campaign.dropDate).getTime() <= Date.now();
}
