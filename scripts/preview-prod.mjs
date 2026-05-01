import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";

const API_START_TIMEOUT_MS = Number(process.env.MYGOBTI_API_START_TIMEOUT_MS ?? 30000);
const API_POLL_INTERVAL_MS = Number(process.env.MYGOBTI_API_POLL_INTERVAL_MS ?? 300);
const API_PORT_SCAN_LIMIT = Number(process.env.MYGOBTI_API_PORT_SCAN_LIMIT ?? 10);
const WEB_PORT_SCAN_LIMIT = Number(process.env.MYGOBTI_WEB_PORT_SCAN_LIMIT ?? 10);
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "0.0.0.0"]);

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = new Set();
let shuttingDown = false;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function isLocalOrigin(origin) {
  return LOCAL_HOSTS.has(origin.hostname);
}

function getPortFromOrigin(origin) {
  if (origin.port) {
    return Number(origin.port);
  }

  return origin.protocol === "https:" ? 443 : 80;
}

function buildHealthUrl(origin) {
  return new URL("/api/health", origin).toString();
}

function buildApiBaseUrl(origin) {
  return new URL("/api", origin).toString().replace(/\/$/, "");
}

function request(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (response) => {
      const chunks = [];

      response.on("data", (chunk) => {
        chunks.push(chunk);
      });
      response.on("end", () => {
        resolve({
          statusCode: response.statusCode ?? 500,
          body: Buffer.concat(chunks).toString("utf8"),
        });
      });
    });

    req.on("error", reject);
    req.setTimeout(2000, () => {
      req.destroy(new Error(`Request timed out for ${url}.`));
    });
  });
}

async function requestJson(url) {
  const response = await request(url);
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`Request to ${url} returned ${response.statusCode}.`);
  }

  return JSON.parse(response.body);
}

async function requestOk(url) {
  const response = await request(url);
  return response.statusCode >= 200 && response.statusCode < 300;
}

function spawnChild(command, args, extraEnv = {}) {
  const child = spawn(command, args, {
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

async function runCommand(args, extraEnv = {}) {
  const child = spawnChild(npmCommand, args, extraEnv);

  await new Promise((resolve, reject) => {
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `Command "${[npmCommand, ...args].join(" ")}" exited with ${signal ?? code ?? "unknown"}.`,
        ),
      );
    });
    child.on("error", reject);
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

async function findAvailablePort(startPort, host, scanLimit) {
  for (let offset = 0; offset < scanLimit; offset += 1) {
    const candidatePort = startPort + offset;
    const available = await checkPortAvailable(candidatePort, host);
    if (available) {
      return candidatePort;
    }
  }

  throw new Error(
    `No free port found in range ${startPort}-${startPort + scanLimit - 1} on ${host}.`,
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
      if (health?.ok) {
        return health;
      }
    } catch {
      // API may still be booting.
    }

    await wait(API_POLL_INTERVAL_MS);
  }

  throw new Error(
    `API did not become healthy within ${API_START_TIMEOUT_MS}ms at ${healthUrl}.`,
  );
}

async function waitForPreviewReady(url, previewProcess) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < API_START_TIMEOUT_MS) {
    if (previewProcess.exitCode !== null) {
      throw new Error(`Preview process exited early with code ${previewProcess.exitCode}.`);
    }

    try {
      if (await requestOk(url)) {
        return;
      }
    } catch {
      // Preview may still be booting.
    }

    await wait(API_POLL_INTERVAL_MS);
  }

  throw new Error(
    `Preview did not become reachable within ${API_START_TIMEOUT_MS}ms at ${url}.`,
  );
}

function getRequestedApiOrigin() {
  const configuredOrigin = process.env.MYGOBTI_PREVIEW_API_ORIGIN?.trim();
  return new URL(trimTrailingSlash(configuredOrigin || "http://127.0.0.1:3001"));
}

function getRequestedWebHost() {
  return process.env.MYGOBTI_PREVIEW_WEB_HOST?.trim() || "127.0.0.1";
}

function getRequestedWebPort() {
  return Number(process.env.MYGOBTI_PREVIEW_WEB_PORT ?? 4173);
}

function formatWebUrl(host, port) {
  const displayHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  return `http://${displayHost}:${port}/`;
}

async function resolveApiPlan() {
  const requestedApiOrigin = getRequestedApiOrigin();
  const requestedHealthUrl = buildHealthUrl(requestedApiOrigin);

  if (!isLocalOrigin(requestedApiOrigin)) {
    return {
      apiOrigin: requestedApiOrigin,
      needsStart: false,
      healthUrl: requestedHealthUrl,
      reusedHealthyApi: true,
    };
  }

  if (await isHealthyApiReachable(requestedHealthUrl)) {
    return {
      apiOrigin: requestedApiOrigin,
      needsStart: false,
      healthUrl: requestedHealthUrl,
      reusedHealthyApi: true,
    };
  }

  const requestedPort = getPortFromOrigin(requestedApiOrigin);
  const selectedPort = await findAvailablePort(requestedPort, "127.0.0.1", API_PORT_SCAN_LIMIT);
  const apiOrigin = new URL(`${requestedApiOrigin.protocol}//127.0.0.1:${selectedPort}`);

  return {
    apiOrigin,
    needsStart: true,
    healthUrl: buildHealthUrl(apiOrigin),
    reusedHealthyApi: false,
    requestedPort,
    selectedPort,
  };
}

async function resolveWebPlan() {
  const requestedHost = getRequestedWebHost();
  const requestedPort = getRequestedWebPort();
  const selectedPort = await findAvailablePort(requestedPort, "127.0.0.1", WEB_PORT_SCAN_LIMIT);

  return {
    host: requestedHost,
    requestedPort,
    selectedPort,
    url: formatWebUrl(requestedHost, selectedPort),
  };
}

async function main() {
  process.on("SIGINT", () => {
    terminateChildren("SIGINT");
  });
  process.on("SIGTERM", () => {
    terminateChildren("SIGTERM");
  });

  const apiPlan = await resolveApiPlan();
  const webPlan = await resolveWebPlan();
  const apiBaseUrl = buildApiBaseUrl(apiPlan.apiOrigin);

  if (apiPlan.needsStart && apiPlan.selectedPort !== apiPlan.requestedPort) {
    console.warn(
      `[preview:prod] port ${apiPlan.requestedPort} unavailable; starting apps/api on ${apiPlan.selectedPort} instead.`,
    );
  } else if (apiPlan.reusedHealthyApi) {
    console.log(`[preview:prod] reusing healthy API at ${apiPlan.healthUrl}`);
  }

  if (webPlan.selectedPort !== webPlan.requestedPort) {
    console.warn(
      `[preview:prod] port ${webPlan.requestedPort} unavailable; using preview port ${webPlan.selectedPort} instead.`,
    );
  }

  console.log(`[preview:prod] building web with VITE_API_BASE_URL=${apiBaseUrl}`);
  await runCommand(["run", "build"], {
    VITE_API_BASE_URL: apiBaseUrl,
  });

  if (apiPlan.needsStart) {
    const apiProcess = spawnChild(
      npmCommand,
      ["run", "start", "--workspace", "apps/api"],
      {
        PORT: String(apiPlan.selectedPort),
      },
    );

    apiProcess.on("exit", (code, signal) => {
      if (!shuttingDown) {
        console.error(
          `[preview:prod] apps/api exited unexpectedly (${signal ?? code ?? "unknown"}).`,
        );
        terminateChildren();
        process.exitCode = code ?? 1;
      }
    });

    console.log(`[preview:prod] waiting for API health at ${apiPlan.healthUrl}`);
    const health = await waitForApiHealthy(apiPlan.healthUrl, apiProcess);
    console.log(`[preview:prod] API ready: ${health.version} (${health.sourcePath})`);
  }

  const previewProcess = spawnChild(
    npmCommand,
    [
      "run",
      "preview",
      "--workspace",
      "apps/web",
      "--",
      "--host",
      webPlan.host,
      "--port",
      String(webPlan.selectedPort),
      "--strictPort",
    ],
    {
      VITE_API_BASE_URL: apiBaseUrl,
    },
  );

  previewProcess.on("exit", (code, signal) => {
    if (!shuttingDown) {
      console.error(
        `[preview:prod] apps/web preview exited unexpectedly (${signal ?? code ?? "unknown"}).`,
      );
      terminateChildren();
      process.exitCode = code ?? 1;
    }
  });

  await waitForPreviewReady(webPlan.url, previewProcess);

  console.log(`[preview:prod] web: ${webPlan.url}`);
  console.log(`[preview:prod] api: ${apiBaseUrl}`);
  console.log(
    `[preview:prod:ready] ${JSON.stringify({
      webUrl: webPlan.url,
      apiBaseUrl,
      apiHealthUrl: apiPlan.healthUrl,
    })}`,
  );
}

main().catch((error) => {
  console.error(`[preview:prod] ${error instanceof Error ? error.message : String(error)}`);
  terminateChildren();
  process.exit(1);
});
