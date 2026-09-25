import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Phase 0 — Project foundation", () => {
  it("package.json contains required scripts and dependencies", () => {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.scripts.lint).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();

    expect(pkg.dependencies.next).toBeDefined();
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.dependencies["react-dom"]).toBeDefined();
    expect(pkg.dependencies.zod).toBeDefined();
  });

  it("README.md does not require API key in env", () => {
    const readmePath = path.resolve(process.cwd(), "README.md");
    const readme = fs.readFileSync(readmePath, "utf-8");

    expect(readme).not.toContain("OPENROUTER_API_KEY=");
    expect(readme).toContain("npm install");
    expect(readme).toContain("npm run dev");
    expect(readme).toContain("npm run build");
  });
});
