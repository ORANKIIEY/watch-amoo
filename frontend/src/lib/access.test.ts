import { describe, expect, it } from "vitest";
import { hasActiveAccess, toCatalogLanguage, type Profile } from "./access";

function profile(partial: Partial<Profile> = {}): Profile {
  return {
    id: "user-1",
    language: "sepedi",
    subscription_status: "none",
    trial_ends_at: null,
    ...partial,
  };
}

describe("hasActiveAccess", () => {
  it("allows an active subscription", () => {
    expect(hasActiveAccess(profile({ subscription_status: "active" }))).toBe(true);
  });

  it("allows a trial that has not ended", () => {
    const later = new Date(Date.now() + 60_000).toISOString();
    expect(
      hasActiveAccess(profile({ subscription_status: "trialing", trial_ends_at: later }))
    ).toBe(true);
  });

  it("blocks an expired trial", () => {
    const earlier = new Date(Date.now() - 60_000).toISOString();
    expect(
      hasActiveAccess(profile({ subscription_status: "trialing", trial_ends_at: earlier }))
    ).toBe(false);
  });

  it("blocks users who have not started a trial", () => {
    expect(hasActiveAccess(profile())).toBe(false);
  });
});

describe("toCatalogLanguage", () => {
  it("maps stored ids to catalog labels", () => {
    expect(toCatalogLanguage("setswana")).toBe("Setswana");
    expect(toCatalogLanguage("Sesotho")).toBe("Sesotho");
    expect(toCatalogLanguage("x")).toBeNull();
  });
});
