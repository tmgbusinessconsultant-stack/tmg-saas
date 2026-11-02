(async () => {
  const { readdir, readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const cssDirectory = join(process.cwd(), ".next", "static", "css");
  const cssFiles = (await readdir(cssDirectory))
    .filter((file) => file.endsWith(".css"));

  if (cssFiles.length === 0) {
    throw new Error("Next.js build did not emit any CSS files.");
  }

  const css = (
    await Promise.all(cssFiles.map((file) => readFile(join(cssDirectory, file), "utf8")))
  ).join("\n");

  const requiredSelectors = [".flex{", ".hidden{", ".grid{", ".sticky{", ".md\\:grid-cols-2{"];
  const missingSelectors = requiredSelectors.filter((selector) => !css.includes(selector));

  if (missingSelectors.length > 0) {
    throw new Error(`Tailwind CSS is missing required selectors: ${missingSelectors.join(", ")}`);
  }

  console.log(`Verified Tailwind utility CSS in ${cssFiles.length} generated stylesheet(s).`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
