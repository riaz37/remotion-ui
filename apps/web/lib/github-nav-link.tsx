import { GitHubStarButton } from "@/components/github-star-button";
import { XIcon } from "@/components/brand-icons";
import { siteConfig } from "@/lib/site-config";

export const githubStarNavLink = {
  type: "custom" as const,
  secondary: true,
  children: <GitHubStarButton />,
};

export const xNavLink = {
  type: "icon" as const,
  label: "RemotionUI on X",
  text: "X",
  icon: <XIcon className="size-4" />,
  url: siteConfig.xUrl,
  external: true,
  secondary: true,
};
