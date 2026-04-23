import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";

const API_START_TIMEOUT_MS = Number(process.env.MYGOBTI_API_START_TIMEOUT_MS ?? 30000);
const API_POLL_INTERVAL_MS = Number(process.env.MYGOBTI_API_POLL_INTERVAL_MS ?? 300);
const API_PORT_SCAN_LIMIT = Number(process.env.MYGOBTI_API_PORT_SCAN_LIMIT ?? 10);
const LOCAL_API_HOSTS = new Set(["127.0.0.1", "localhost", "0.0.0.0"]);

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = new Set();
let shuttingDown = false;

function startWorkspaceDev(workspaceName, extraEnv = {}) {
  const child = spawn(npmCommand, ["run", "dev", "--workspace", workspaceName], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: "inherit",
  });

  children.add(child);
  child.on("exit", () => {
    children.delete(child);
  });

  return child;
}

function terminateChildren(signal = "SIGTERM") {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function getRequestedApiOrigin() {
  const proxyTarget = process.env.VITE_API_PROXY_TARGET?.trim();
  const configuredOrigin = proxyTarget || "http://127.0.0.1:3001";

  return new URL(trimTrailingSlash(configuredOrigin));
}

function buildHealthUrl(origin) {
  const configuredHealthUrl = process.env.MYGOBTI_API_HEALTH_URL?.trim();
  if (configuredHealthUrl) {
    return configuredHealthUrl;
  }

  return new URL("/api/health", origin).toString();
}

function isLocalApiOrigin(origin) {
  return LOCAL_API_HOSTS.has(origin.hostname);
}

function getPortFromOrigin(origin) {
  if (origin.port) {
    return Number(origin.port);
  }

  return origin.protocol === "https:" ? 443 : 80;
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      const chunks = [];

      response.on("data", (chunk) => {
        chunks.push(chunk);
      });
      response.on("end", () => {
        if ((response.statusCode ?? 500) < 200 || (response.statusCode ?? 500) >= 300) {
          reject(
            new Error(`API health check returned ${response.statusCode ?? "unknown"} for ${url}.`),
          );
          return;
        }

        try {
          const body = Buffer.concat(chunks).toString("utf8");
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on("error", reject);
    request.setTimeout(2000, () => {
      request.destroy(new Error(`API health check timed out for ${url}.`));
    });
  });
}

function checkPortAvailable(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (error) => {
      resolve(error?.code !== "EADDRINUSE");
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

async function findAvailablePort(startPort, host) {
  for (let offset = 0; offset < API_PORT_SCAN_LIMIT; offset += 1) {
    const candidatePort = startPort + offset;
    const available = await checkPortAvailable(candidatePort, host);
    if (available) {
      return candidatePort;
    }
  }

  throw new Error(
    `No free local API port found in range ${startPort}-${startPort + API_PORT_SCAN_LIMIT - 1}.`,
  );
}

async function isHealthyApiReachable(healthUrl) {
  try {
    const health = await requestJson(healthUrl);
    return Boolean(health?.ok);
  } catch {
    return false;
  }
}

async function waitForApiHealthy(healthUrl, apiProcess) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < API_START_TIMEOUT_MS) {
    if (apiProcess.exitCode !== null) {
      throw new Error(`API process exited early with code ${apiProcess.exitCode}.`);
    }

    try {
      const health = await requestJson(healthUrl);
      if (health && health.ok) {
        return health;
      }
    } catch {
      // API may still be booting. Keep polling until timeout.
    }

    await wait(API_POLL_INTERVAL_MS);
  }

  throw new Error(
    `API did not become healthy within ${API_START_TIMEOUT_MS}ms at ${healthUrl}.`,
  );
}

async function main() {
  process.on("SIGINT", () => {
    terminateChildren("SIGINT");
  });
  process.on("SIGTERM", () => {
    terminateChildren("SIGTERM");
  });

  const requestedApiOrigin = getRequestedApiOrigin();
  const requestedHealthUrl = buildHealthUrl(requestedApiOrigin);

  let proxyTarget = trimTrailingSlash(requestedApiOrigin.origin);

  if (isLocalApiOrigin(requestedApiOrigin)) {
    const requestedPort = getPortFromOrigin(requestedApiOrigin);
    let apiProcess = null;
    let selectedPort = requestedPort;

    if (await isHealthyApiReachable(requestedHealthUrl)) {
      console.log(`[dev] reusing healthy API at ${requestedHealthUrl}`);
    } else {
      selectedPort = await findAvailablePort(requestedPort, "127.0.0.1");
      proxyTarget = `${requestedApiOrigin.protocol}//127.0.0.1:${selectedPort}`;
      const selectedHealthUrl = buildHealthUrl(new URL(proxyTarget));

      if (selectedPort !== requestedPort) {
        console.warn(
          `[dev] port ${requestedPort} unavailable; starting apps/api on ${selectedPort} instead.`,
        );
      }

      apiProcess = startWorkspaceDev("apps/api", {
        PORT: String(selectedPort),
      });
      apiProcess.on("exit", (code, signal) => {
        if (!shuttingDown) {
          console.error(`[dev] apps/api exited unexpectedly (${signal ?? code ?? "unknown"}).`);
          terminateChildren();
          process.exitCode = code ?? 1;
        }
      });

      console.log(`[dev] waiting for API health at ${selectedHealthUrl}`);
      const health = await waitForApiHealthy(selectedHealthUrl, apiProcess);
      console.log(`[dev] API ready: ${health.version} (${health.sourcePath})`);
    }
  } else {
    console.log(`[dev] using external API target ${proxyTarget}`);
  }

  const webProcess = startWorkspaceDev("apps/web", {
    VITE_API_PROXY_TARGET: proxyTarget,
  });
  webProcess.on("exit", (code, signal) => {
    if (!shuttingDown) {
      console.error(`[dev] apps/web exited (${signal ?? code ?? "unknown"}).`);
      terminateChildren();
      process.exitCode = code ?? 0;
    }
  });
}

main().catch((error) => {
  console.error(`[dev] ${error instanceof Error ? error.message : String(error)}`);
  terminateChildren();
  process.exit(1);
});
