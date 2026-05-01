/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function createApiProxy(target: string) {
  return {
    "/api": {
      target,
      changeOrigin: true,
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = trimTrailingSlash(
    env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3001",
  );
  const apiProxy = createApiProxy(proxyTarget);

  return {
    plugins: [react()],
    server: {
      proxy: apiProxy,
    },
    preview: {
      proxy: apiProxy,
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts",
    },
  };
});
