import { describe, expect, it } from "vitest";
import { CATALOG, filterCatalog } from "./catalog";
import { parseQueryLocally } from "./discovery";

describe("filterCatalog", () => {
  it("filters by language", () => {
    const rows = filterCatalog({ language: "Setswana" });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((v) => v.language === "Setswana")).toBe(true);
  });

  it("returns empty when no match", () => {
    const rows = filterCatalog({ language: "Sepedi", theme: "numbers", ageRange: "4-6" });
    expect(rows).toEqual([]);
  });

  it("keeps pilot catalog size", () => {
    expect(CATALOG.length).toBe(3);
  });
});

describe("parseQueryLocally", () => {
  it("parses setswana kids query", () => {
    const r = parseQueryLocally("Setswana videos for kids");
    expect(r.language).toBe("Setswana");
    expect(r.ageRange).toBe("2-4");
  });
});
