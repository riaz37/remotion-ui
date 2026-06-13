import { GitHubStarButton } from "@/components/github-star-button";

export const githubStarNavLink = {
  type: "custom" as const,
  secondary: true,
  children: <GitHubStarButton />,
};
