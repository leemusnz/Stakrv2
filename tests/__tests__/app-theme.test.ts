/**
 * Regression guard for B-029: the signed-in pages lost the alpha gate's look
 * (always-white pages, no dark mode) and body text fell back to Arial because
 * Tailwind's default font pointed at a font the layout never loads.
 */
import fs from "fs";
import path from "path";
import tailwindConfig from "../../tailwind.config";
import { button, field, panel } from "@/components/mvp/shell";

const root = path.join(__dirname, "..", "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("app theme (B-029)", () => {
  it("only uses font variables the root layout actually loads", () => {
    const layout = read("app/layout.tsx");
    const loaded = [...layout.matchAll(/variable: "(--font-[a-z-]+)"/g)].map(
      (m) => m[1],
    );
    expect(loaded.length).toBeGreaterThan(0);
    const families = tailwindConfig.theme?.extend?.fontFamily as Record<
      string,
      string[]
    >;
    for (const [name, stack] of Object.entries(families)) {
      for (const v of stack.join(" ").match(/--font-[a-z-]+/g) ?? []) {
        expect({ name, v, loaded: loaded.includes(v) }).toEqual({
          name,
          v,
          loaded: true,
        });
      }
    }
  });

  it("does not force a system font over the design font", () => {
    expect(read("app/globals.css")).not.toMatch(/font-family:\s*Arial/);
  });

  it("gives the shared card, field and button a dark-mode style", () => {
    for (const classes of [panel, field, button]) {
      expect(classes).toMatch(/\bdark:/);
    }
  });

  it("pairs every hardcoded light colour in the signed-in pages with a dark one", () => {
    const dir = path.join(root, "components", "mvp");
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => path.join("components", "mvp", f))
      .concat("app/edit-challenge/[id]/page.tsx");
    const light =
      /(?<![\w:!-])!?(text|bg|border|divide)-(slate|orange|amber|red|emerald|violet)-\d{2,3}\b/;
    const unpaired: string[] = [];
    for (const file of files) {
      for (const m of read(file).matchAll(
        /className=(?:"([^"]*)"|\{([^}]*)\})/g,
      )) {
        const classes = m[1] ?? m[2];
        if (light.test(classes) && !/\bdark:/.test(classes))
          unpaired.push(`${file}: ${classes.trim().slice(0, 80)}`);
      }
    }
    expect(unpaired).toEqual([]);
  });
});
