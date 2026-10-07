import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cpSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import type { Plugin } from "vite";

const host = process.env.TAURI_DEV_HOST;
const rootDir = import.meta.dirname;

/**
 * pdf.js loads CMaps, standard fonts, ICC profiles and wasm decoders by URL at run time.
 * Dev serves them from /node_modules/pdfjs-dist/; the build copies them to dist/pdfjs/.
 */
function pdfjsAssets(): Plugin {
  let outDir = "dist";
  return {
    name: "pdfjs-assets",
    apply: "build",
    configResolved: (config) => {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    writeBundle: () => {
      for (const dir of ["cmaps", "standard_fonts", "iccs", "wasm"]) {
        cpSync(path.resolve(rootDir, "node_modules/pdfjs-dist", dir), path.join(outDir, "pdfjs", dir), { recursive: true });
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react(), tailwindcss(), pdfjsAssets()],
  resolve: {
    alias: { "@": path.resolve(rootDir, "./src") },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 5180,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 5181,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
}));
