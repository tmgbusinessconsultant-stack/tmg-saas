(async () => {
  const { readdir, readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const cssDirectory = join(process.cwd(), ".next", "static", "css");
  const cssFiles = (await readdir(cssDirectory)).filter(f => f.endsWith(".css"));
  if (cssFiles.length === 0) throw new Error("No CSS files");
  const cssList = await Promise.all(cssFiles.map(async f => {
    const content = await readFile(join(cssDirectory, f), "utf8");
    console.log(`File ${f}: ${content.length} bytes, .flex=${content.includes(".flex")}`);
    return content;
  }));
  const css = cssList.join("\n");
  console.log(`Total CSS length: ${css.length}`);
  const required = [".flex", ".hidden", ".grid", ".sticky", "grid-cols-2"];
  const missing = required.filter(s => !css.includes(s));
  if (missing.length > 0) throw new Error(`Tailwind missing: ${missing.join(", ")} - length ${css.length}`);
  console.log(`Verified Tailwind in ${cssFiles.length} file(s) - OK`);
})().catch(e => { console.error(e); process.exitCode = 1; });