import { describe, expect, it } from "vitest";
import { parseQueryLocally } from "./discovery";
import { validatePassword } from "./security";

describe("parseQueryLocally", () => {
  it("extracts Sepedi language", () => {
    const r = parseQueryLocally("nursery rhymes in Sepedi");
    expect(r.language).toBe("Sepedi");
    expect(r.source).toBe("local");
  });

  it("maps baby to age 0-2", () => {
    const r = parseQueryLocally("Sesotho songs for my baby");
    expect(r.language).toBe("Sesotho");
    expect(r.ageRange).toBe("0-2");
  });

  it("finds greeting themes", () => {
    const r = parseQueryLocally("dumela greeting songs");
    expect(r.theme).toBe("greeting");
  });
});

describe("validatePassword", () => {
  it("requires length letter and number", () => {
    expect(validatePassword("short")).toBeTruthy();
    expect(validatePassword("password")).toBeTruthy();
    expect(validatePassword("Password1")).toBeNull();
  });
});
