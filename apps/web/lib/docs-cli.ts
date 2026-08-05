export const CLI_PACKAGE = "npx remotion-ui@latest";

export function cliAddCommand(names: string): string {
  return `${CLI_PACKAGE} add ${names}`;
}
