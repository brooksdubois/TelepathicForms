import { defineConfig, loadEnv, type Plugin } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';
import tailwindcss from "@tailwindcss/vite";
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { staticRoutePaths } from './src/routes';

const routeFallbackPages = (): Plugin => {
  let outDir = "dist";

  return {
    name: "route-fallback-pages",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const rootIndexPath = path.join(outDir, "index.html");
      const rootIndexHtml = await readFile(rootIndexPath, "utf8");

      await Promise.all(staticRoutePaths.map(async (routePath) => {
        const nestingDepth = routePath.split("/").length;
        const assetPrefix = `${"../".repeat(nestingDepth)}assets/`;
        const routeIndexHtml = rootIndexHtml.replaceAll("./assets/", assetPrefix);
        const routeDir = path.join(outDir, routePath);

        await mkdir(routeDir, { recursive: true });
        await writeFile(path.join(routeDir, "index.html"), routeIndexHtml);
      }));
    },
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  console.log("Loaded environment variables from .env:", env.GEMINI_API_KEY);
  return {
    base: "./",
    plugins: [devtools(), solidPlugin(), tailwindcss(), routeFallbackPages()],
    resolve: {
      alias: [
        {
          find: "solid-codeblock",
          replacement: fileURLToPath(
            new URL("./node_modules/solid-codeblock/dist/index.js", import.meta.url),
          ),
        },
        {
          find: /^shiki$/,
          replacement: fileURLToPath(new URL("./src/designer/shikiCompat.ts", import.meta.url)),
        },
      ],
    },
    server: {
      port: 3000,
      proxy: {
        "/api/gemini": {
          target: "https://generativelanguage.googleapis.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) =>
            `/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        },
      },
    },
    build: {
      target: 'esnext',
    },
  };
});
