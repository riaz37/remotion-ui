import fs from "fs-extra";

export type CompositionMeta = {
  id: string;
  component: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  importPath?: string;
};

export async function patchRootTsx(
  rootPath: string,
  meta: CompositionMeta,
  { log = console.log }: { log?: (line: string) => void } = {},
): Promise<void> {
  if (!(await fs.pathExists(rootPath))) {
    throw new Error(`Root file not found: ${rootPath}`);
  }

  const content = await fs.readFile(rootPath, "utf-8");

  if (content.includes(`id="${meta.id}"`) || content.includes(`id={'${meta.id}'}`)) {
    log(`  · Composition "${meta.id}" already registered in Root.tsx`);
    return;
  }

  const importPath =
    meta.importPath ??
    `@/compositions/${meta.component.toLowerCase().replace(/composition$/, "")}/index`;
  const importStatement = `import { ${meta.component} } from "${importPath}";`;

  let updated = content;

  if (!updated.includes(importStatement)) {
    const lastImportIndex = findLastImportIndex(updated);
    if (lastImportIndex === -1) {
      updated = `${importStatement}\n${updated}`;
    } else {
      const insertAt = updated.indexOf("\n", lastImportIndex) + 1;
      updated =
        updated.slice(0, insertAt) + importStatement + "\n" + updated.slice(insertAt);
    }
  }

  const compositionEntry = `      <Composition
        id="${meta.id}"
        component={${meta.component}}
        durationInFrames={${meta.durationInFrames}}
        fps={${meta.fps}}
        width={${meta.width}}
        height={${meta.height}}
      />`;

  if (updated.includes("</>")) {
    updated = updated.replace("</>", `${compositionEntry}\n    </>`);
  } else if (updated.includes("</RemotionRoot>")) {
    updated = updated.replace(
      "</RemotionRoot>",
      `${compositionEntry}\n    </RemotionRoot>`,
    );
  } else {
    throw new Error(
      "Could not find a suitable insertion point in Root.tsx for the Composition.",
    );
  }

  if (!updated.includes('import { Composition')) {
    updated = updated.replace(
      /from "remotion";/,
      'from "remotion";\nimport { Composition } from "remotion";',
    );
    if (!updated.includes("import { Composition }")) {
      updated = `import { Composition } from "remotion";\n${updated}`;
    }
  }

  await fs.writeFile(rootPath, updated, "utf-8");
  log(`  ✓ Registered composition "${meta.id}" in Root.tsx`);
}

function findLastImportIndex(content: string): number {
  const imports = [...content.matchAll(/^import .+$/gm)];
  if (imports.length === 0) {
    return -1;
  }
  const last = imports[imports.length - 1];
  return last.index ?? -1;
}
