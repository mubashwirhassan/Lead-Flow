import { describe, it, expect } from "vitest";
import { generateToken, hashToken, safeEqual, generateApiKey } from "../tokens";

describe("tokens", () => {
  it("generates 64-char hex tokens", () => {
    const t = generateToken();
    expect(t).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes deterministically (verifiable) and differs from raw", () => {
    const t = generateToken();
    const h1 = hashToken(t);
    const h2 = hashToken(t);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(t);
  });

  it("safeEqual compares correctly", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });

  it("API keys use lf_ prefix", () => {
    expect(generateApiKey().startsWith("lf_")).toBe(true);
  });
});
