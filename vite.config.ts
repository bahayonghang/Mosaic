import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cpSync, createReadStream } from "node:fs";
import path from "node:path";
import process from "node:process";
import type { Plugin } from "vite";

const host = process.env.TAURI_DEV_HOST;
const rootDir = import.meta.dirname;

/**
 * pdf.js loads CMaps, standard fonts, ICC profiles and wasm decoders by URL.
 * Dev serves those directories from /node_modules/pdfjs-dist/; the build copies them to dist/pdfjs/.
 * The worker is always /pdfjs/pdf.worker.min.mjs. Dev streams the prebuilt file; the build copies it.
 */
function pdfjsAssets(): Plugin {
  let outDir = "dist";
  return {
    name: "pdfjs-assets",
    configResolved: (config) => {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    // Serve the prebuilt worker as a static file. A raw /node_modules URL is transformed by Vite and injects the dev client into the worker.
    configureServer(server) {
      const workerPath = path.resolve(rootDir, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== "/pdfjs/pdf.worker.min.mjs") {
          next();
          return;
        }
        res.setHeader("Content-Type", "text/javascript");
        createReadStream(workerPath).pipe(res);
      });
    },
    writeBundle: () => {
      const pkg = path.resolve(rootDir, "node_modules/pdfjs-dist");
      const dest = path.join(outDir, "pdfjs");
      for (const dir of ["cmaps", "standard_fonts", "iccs", "wasm"]) {
        cpSync(path.join(pkg, dir), path.join(dest, dir), { recursive: true });
      }
      cpSync(path.join(pkg, "build/pdf.worker.min.mjs"), path.join(dest, "pdf.worker.min.mjs"));
    },
  };
}

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react(), tailwindcss(), pdfjsAssets()],
  resolve: {
    alias: { "@": path.resolve(rootDir, "./src") },
  },
  build: {
    rolldownOptions: {
      // Printed when one plugin callback exceeds 1s. On this app that callback is
      // @tailwindcss/vite generate:build, which compiles the Tailwind v4 stylesheet.
      checks: { bundlerTimings: false },
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor",
              // Only the entry's static dependencies. pdf.js and pdf-lib are dynamic
              // imports and must stay out of the first load.
              tags: ["$initial"],
              test: (id: string) => id.replaceAll("\\", "/").includes("/node_modules/"),
            },
          ],
        },
      },
    },
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
