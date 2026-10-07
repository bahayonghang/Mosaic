import { DEFAULT_EXPORT_SUFFIX, suffixError, suffixedName } from "./exportName";

describe("suffixError", () => {
  it("accepts the default and plain suffixes", () => {
    expect(suffixError(DEFAULT_EXPORT_SUFFIX)).toBeNull();
    expect(suffixError("-masked")).toBeNull();
    expect(suffixError("  _x  ")).toBeNull();
  });

  it("rejects empty, long, and forbidden values", () => {
    expect(suffixError("")).toBe("后缀不能为空");
    expect(suffixError("   ")).toBe("后缀不能为空");
    expect(suffixError("x".repeat(32))).toBeNull();
    expect(suffixError("x".repeat(33))).toBe("后缀最多 32 个字符");
    for (const c of ["\\", "/", ":", "*", "?", '"', "<", ">", "|", "\u0001"])
      expect(suffixError(`a${c}b`)).not.toBeNull();
  });
});

describe("suffixedName", () => {
  it("puts the suffix before the last extension", () => {
    expect(suffixedName("证书.jpg", "_打码版")).toBe("证书_打码版.jpg");
    expect(suffixedName("a.b.PNG", "-m")).toBe("a.b-m.PNG");
    expect(suffixedName("noext", "-m")).toBe("noext-m");
  });
});
