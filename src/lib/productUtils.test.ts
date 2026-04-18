import { describe, it, expect } from "vitest";
import { isOrderable } from "./productUtils";

describe("isOrderable", () => {
  it("returns true for valid lowercase UUIDs (real DB products)", () => {
    expect(isOrderable("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("returns true for valid uppercase UUIDs", () => {
    expect(isOrderable("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });

  it("returns false for short numeric demo product IDs", () => {
    expect(isOrderable("1")).toBe(false);
    expect(isOrderable("42")).toBe(false);
  });

  it("returns false for empty strings", () => {
    expect(isOrderable("")).toBe(false);
  });

  it("returns false for malformed UUID-like strings", () => {
    expect(isOrderable("550e8400-e29b-41d4-a716")).toBe(false);
    expect(isOrderable("not-a-uuid-at-all")).toBe(false);
    expect(isOrderable("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")).toBe(false);
  });

  it("returns false for arbitrary text", () => {
    expect(isOrderable("product-1")).toBe(false);
    expect(isOrderable("tomato")).toBe(false);
  });
});
