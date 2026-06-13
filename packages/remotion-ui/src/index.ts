import { Command } from "commander";
import { addCommand } from "./commands/add.js";
import { buildCommand } from "./commands/build.js";
import { diffCommand } from "./commands/diff.js";
import { doctorCommand } from "./commands/doctor.js";
import { initCommand } from "./commands/init.js";
import { listCommand } from "./commands/list.js";
import { updateCommand } from "./commands/update.js";
import { searchCommand } from "./commands/search.js";
import { viewCommand } from "./commands/view.js";

const program = new Command();

program
  .name("remotion-ui")
  .description("Add Remotion video components to your project")
  .version("0.5.1");

program
  .command("init")
  .description("Initialize a new Remotion project with RemotionUI")
  .argument("[project-name]", "project directory name", "my-video")
  .option("-y, --yes", "Skip confirmation prompts")
  .option(
    "--existing",
    "Bootstrap remotion-ui.json in the current Remotion project",
  )
  .option(
    "--starter <starter>",
    "Project starter: default, social, or podcast",
    "default",
  )
  .action(
    async (
      projectName: string,
      options: { yes?: boolean; existing?: boolean; starter?: string },
    ) => {
    try {
      const starter = options.starter as "default" | "social" | "podcast";
      if (!["default", "social", "podcast"].includes(starter)) {
        throw new Error(
          `Invalid starter "${options.starter}". Use default, social, or podcast.`,
        );
      }
      await initCommand(projectName, {
        yes: options.yes,
        existing: options.existing,
        starter,
      });
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Failed to initialize project",
      );
      process.exit(1);
    }
    },
  );

program
  .command("add")
  .description("Add a component to your project")
  .argument("[components...]", "component names to add")
  .option(
    "-r, --registry-url <url>",
    "Registry base URL or local path to public/r/",
  )
  .option("--preset <preset>", "Registry preset", "default")
  .option("--recipe <slug>", "Install a task-first recipe by slug")
  .option("-y, --yes", "Skip confirmation prompts")
  .action(async (components: string[], options) => {
    try {
      await addCommand(components, {
        registryUrl: options.registryUrl,
        preset: options.preset,
        yes: options.yes,
        recipe: options.recipe,
      });
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Failed to add components",
      );
      process.exit(1);
    }
  });

program
  .command("doctor")
  .description("Diagnose remotion-ui.json, aliases, and Remotion setup")
  .option("--json", "Output machine-readable JSON")
  .action(async (options: { json?: boolean }) => {
    try {
      await doctorCommand({ json: options.json });
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Doctor failed",
      );
      process.exit(1);
    }
  });

program
  .command("list")
  .description("List registry components and installed status")
  .option(
    "-r, --registry-url <url>",
    "Registry base URL or local path to public/r/",
  )
  .option("--json", "Output machine-readable JSON")
  .action(async (options: { registryUrl?: string; json?: boolean }) => {
    try {
      await listCommand({
        registryUrl: options.registryUrl,
        json: options.json,
      });
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "List failed",
      );
      process.exit(1);
    }
  });

program
  .command("search")
  .description("Search the component registry")
  .option("-q, --query <query>", "search query")
  .option("--lane <lane>", "filter by atlas lane (atoms, signals, spatial, …)")
  .option("--tier <tier>", "filter by tier (core, advanced)")
  .option(
    "-r, --registry-url <url>",
    "Registry base URL or local path to public/r/",
  )
  .option("--json", "Output machine-readable JSON")
  .action(
    async (options: {
      query?: string;
      lane?: string;
      tier?: string;
      registryUrl?: string;
      json?: boolean;
    }) => {
    try {
      await searchCommand({
        query: options.query,
        lane: options.lane,
        tier: options.tier,
        registryUrl: options.registryUrl,
        json: options.json,
      });
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Search failed",
      );
      process.exit(1);
    }
    },
  );

program
  .command("view")
  .description("View registry item details")
  .argument("<name>", "component name")
  .option(
    "-r, --registry-url <url>",
    "Registry base URL or local path to public/r/",
  )
  .option("--preset <preset>", "Registry preset", "default")
  .option("--json", "Output machine-readable JSON")
  .action(async (name: string, options) => {
    try {
      await viewCommand(name, {
        registryUrl: options.registryUrl,
        preset: options.preset,
        json: options.json,
      });
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "View failed",
      );
      process.exit(1);
    }
  });

program
  .command("update")
  .description("Update installed component(s) from registry (overwrites files)")
  .argument("[components...]", "component names to update")
  .option(
    "-r, --registry-url <url>",
    "Registry base URL or local path to public/r/",
  )
  .option("--preset <preset>", "Registry preset", "default")
  .option("-y, --yes", "Skip confirmation prompts")
  .action(async (components: string[], options) => {
    try {
      await updateCommand(components, {
        registryUrl: options.registryUrl,
        preset: options.preset,
        yes: options.yes,
      });
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Failed to update components",
      );
      process.exit(1);
    }
  });

program
  .command("diff")
  .description("Diff installed component vs registry")
  .argument("<name>", "component name")
  .option(
    "-r, --registry-url <url>",
    "Registry base URL or local path to public/r/",
  )
  .option("--preset <preset>", "Registry preset", "default")
  .action(async (name: string, options) => {
    try {
      await diffCommand(name, {
        registryUrl: options.registryUrl,
        preset: options.preset,
      });
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Diff failed",
      );
      process.exit(1);
    }
  });

program
  .command("build")
  .description("Build a custom registry")
  .argument("[registry]", "path to registry.json", "registry.json")
  .option("-o, --output <dir>", "output directory for built registry")
  .option("--preset <preset>", "registry preset name", "default")
  .action(async (registry: string, options) => {
    try {
      await buildCommand(registry, {
        outputDir: options.output,
        preset: options.preset,
      });
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Build failed",
      );
      process.exit(1);
    }
  });

program.parse();
