export const GITHUB_REPO_URL = "https://github.com/riaz37/remotion-ui";

export function printStarPrompt(): void {
  const slug = GITHUB_REPO_URL.replace("https://", "");
  console.log(`\n✨ Enjoying RemotionUI? Star us on GitHub → ${slug}`);
}
