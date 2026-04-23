import { describe, expect, it } from "vitest";
import { err, ok, DomainError } from "./index.js";

describe("Result helpers", () => {
  it("wrap values and errors explicitly", () => {
    expect(ok("ready")).toEqual({ ok: true, value: "ready" });

    const error = new DomainError("Invalid state", "INVALID_STATE");
    expect(err(error)).toEqual({ ok: false, error });
  });
});
