import { Command } from "commander";
import { addCommand } from "./commands/add.js";

const program = new Command();

program
  .name("remotion-ui")
  .description("Add Remotion video components to your project")
  .version("0.0.0");

program
  .command("init")
  .description("Initialize a new Remotion project with RemotionUI")
  .action(() => {
    console.log("init: coming soon");
  });

program
  .command("add")
  .description("Add a component to your project")
  .argument("[components...]", "component names to add")
  .option(
    "-r, --registry-url <url>",
    "Registry base URL or local path to public/r/",
  )
  .option("--preset <preset>", "Registry preset", "default")
  .option("-y, --yes", "Skip confirmation prompts")
  .action(async (components: string[], options) => {
    try {
      await addCommand(components, {
        registryUrl: options.registryUrl,
        preset: options.preset,
        yes: options.yes,
      });
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Failed to add components",
      );
      process.exit(1);
    }
  });

program
  .command("search")
  .description("Search the component registry")
  .option("-q, --query <query>", "search query")
  .action((options: { query?: string }) => {
    console.log("search:", options.query ?? "(no query)");
    console.log("search: coming soon");
  });

program
  .command("build")
  .description("Build a custom registry")
  .argument("[registry]", "path to registry.json")
  .action((registry?: string) => {
    console.log("build:", registry ?? "registry.json");
    console.log("build: coming soon");
  });

program.parse();
