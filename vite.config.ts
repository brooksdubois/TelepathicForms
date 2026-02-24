import { defineConfig, loadEnv } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  console.log("Loaded environment variables from .env:", env.GEMINI_API_KEY);
  return {
    plugins: [devtools(), solidPlugin(), tailwindcss()],
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
