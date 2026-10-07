import { DEFAULT_EXPORT_SUFFIX } from "@/lib/exportName";
import { useSettingsStore } from "./settingsStore";

describe("settingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({ exportSuffix: DEFAULT_EXPORT_SUFFIX });
  });

  it("defaults to _打码版 and persists a valid change", () => {
    expect(useSettingsStore.getState().exportSuffix).toBe("_打码版");
    useSettingsStore.getState().setExportSuffix("  -masked ");
    expect(useSettingsStore.getState().exportSuffix).toBe("-masked");
    expect(JSON.parse(localStorage.getItem("mosaic.settings")!).state).toEqual({
      exportSuffix: "-masked",
    });
  });

  it("ignores an invalid value", () => {
    useSettingsStore.getState().setExportSuffix("a:b");
    expect(useSettingsStore.getState().exportSuffix).toBe(DEFAULT_EXPORT_SUFFIX);
  });

  it("falls back to the default for an invalid stored value", async () => {
    localStorage.setItem(
      "mosaic.settings",
      JSON.stringify({ state: { exportSuffix: "a/b" }, version: 1 }),
    );
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().exportSuffix).toBe(DEFAULT_EXPORT_SUFFIX);
    localStorage.setItem(
      "mosaic.settings",
      JSON.stringify({ state: { exportSuffix: "-ok" }, version: 1 }),
    );
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().exportSuffix).toBe("-ok");
  });
});
