import "@testing-library/jest-dom/vitest";

// jsdom has no matchMedia; sonner reads it for the system theme.
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

// jsdom has no ResizeObserver; Radix slider measures its thumb with it.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// No Tauri runtime in tests.
import { mockIPC, mockWindows } from "@tauri-apps/api/mocks";
mockWindows("main");
mockIPC(() => null);
