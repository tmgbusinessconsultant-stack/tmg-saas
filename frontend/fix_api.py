import re, pathlib, glob
# Pattern 1:  X.endsWith("/api") ? X : ${X}/api
# Pattern 2:  X.endsWith("/api") ? X : X + "/api"
# Pattern 3:  X.endsWith("/api") ? X : ${X}/api/ etc - covered by generic
pattern = re.compile(r'([A-Za-z_][\w\.\?\(\) ]*?)\.endsWith\("/api"\)\s*\?\s*\1\s*:\s*(?:\$\{\1\}/api|\1\s*\+\s*"/api")')
for f in glob.glob("src/**/*.ts*", recursive=True):
    p = pathlib.Path(f)
    t = p.read_text(encoding="utf-8", errors="ignore")
    orig = t
    # Replace with case-insensitive version
    def repl(m):
        var = m.group(1).strip()
        return f'{var}.replace(/\\/api$/i, "") + "/api"'
    t = pattern.sub(repl, t)
    if t != orig:
        p.write_text(t, encoding="utf-8")
        print(f"FIXED: {f}")
print("DONE")
