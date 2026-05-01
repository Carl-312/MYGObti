import http from "node:http";
import net from "node:net";
import os from "node:os";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";

const START_TIMEOUT_MS = Number(process.env.MYGOBTI_PREVIEW_START_TIMEOUT_MS ?? 30000);
const POLL_INTERVAL_MS = Number(process.env.MYGOBTI_PREVIEW_POLL_INTERVAL_MS ?? 300);
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

function getRequestedApiOrigin() {
  const configuredOrigin = process.env.MYGOBTI_PREVIEW_API_ORIGIN?.trim();
  return new URL(trimTrailingSlash(configuredOrigin || "http://127.0.0.1:3001"));
}

function getRequestedWebHost() {
  return process.env.MYGOBTI_PREVIEW_WEB_HOST?.trim() || "0.0.0.0";
}

function getRequestedWebPort() {
  return Number(process.env.MYGOBTI_PREVIEW_WEB_PORT ?? 4173);
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

function getPreviewProxyTarget(origin) {
  return trimTrailingSlash(origin.toString());
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

function readProcessList() {
  const output = execFileSync("ps", ["-eo", "pid=,args="], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const firstSpace = line.indexOf(" ");
      return {
        pid: Number(line.slice(0, firstSpace)),
        args: line.slice(firstSpace + 1),
      };
    });
}

function getListeningPids(port) {
  try {
    const output = execFileSync("lsof", [`-t`, `-iTCP:${port}`, `-sTCP:LISTEN`], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => Number(line));
  } catch {
    return [];
  }
}

function runCommandText(command, args) {
  try {
    return execFileSync(command, args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function isRepoPreviewProcess(args) {
  return (
    args.includes(`${process.cwd()}/node_modules/.bin/vite preview`) ||
    args.includes(`${process.cwd()}/node_modules/vite/bin/vite.js preview`)
  );
}

function isRepoApiProcess(args) {
  return (
    (args.includes(`${process.cwd()}/node_modules/.bin/tsx`) ||
      args.includes(`${process.cwd()}/node_modules/tsx/dist/loader.mjs`)) &&
    args.includes("src/server.ts")
  );
}

async function waitForPortReleased(port, timeoutMs = 5000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await checkPortAvailable(port)) {
      return;
    }

    await wait(100);
  }

  throw new Error(`Port ${port} did not become free within ${timeoutMs}ms.`);
}

async function reclaimRepoPort(port, ownerLabel, matchesOwner) {
  const pids = getListeningPids(port);
  if (pids.length === 0) {
    return false;
  }

  const processes = readProcessList().filter((processInfo) => pids.includes(processInfo.pid));
  if (processes.length === 0) {
    return false;
  }

  const ownProcesses = processes.filter((processInfo) => matchesOwner(processInfo.args));
  if (ownProcesses.length !== processes.length) {
    const descriptions = processes.map((processInfo) => `${processInfo.pid}: ${processInfo.args}`);
    throw new Error(
      `[preview:prod] port ${port} is occupied by non-${ownerLabel} process(es):\n${descriptions.join("\n")}`,
    );
  }

  console.warn(
    `[preview:prod] reclaiming ${ownerLabel} port ${port} from pid(s): ${ownProcesses
      .map((processInfo) => processInfo.pid)
      .join(", ")}`,
  );

  for (const processInfo of ownProcesses) {
    try {
      process.kill(processInfo.pid, "SIGTERM");
    } catch {
      // Process may have already exited.
    }
  }

  try {
    await waitForPortReleased(port, 3000);
  } catch {
    for (const processInfo of ownProcesses) {
      try {
        process.kill(processInfo.pid, "SIGKILL");
      } catch {
        // Process may have already exited.
      }
    }

    await waitForPortReleased(port, 3000);
  }

  return true;
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

  while (Date.now() - startedAt < START_TIMEOUT_MS) {
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

    await wait(POLL_INTERVAL_MS);
  }

  throw new Error(`API did not become healthy within ${START_TIMEOUT_MS}ms at ${healthUrl}.`);
}

async function waitForPreviewReady(url, previewProcess) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < START_TIMEOUT_MS) {
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

    await wait(POLL_INTERVAL_MS);
  }

  throw new Error(`Preview did not become reachable within ${START_TIMEOUT_MS}ms at ${url}.`);
}

function getPrimaryIpv4Address() {
  const interfaces = os.networkInterfaces();

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        return entry.address;
      }
    }
  }

  return null;
}

function getRoutePreferredIpv4Address() {
  const route = runCommandText("ip", ["route", "get", "1.1.1.1"]);
  const srcMatch = route.match(/\bsrc\s+(\d+\.\d+\.\d+\.\d+)\b/);
  return srcMatch?.[1] ?? null;
}

function hasHealthyWslInterop() {
  return fs.existsSync("/proc/sys/fs/binfmt_misc/WSLInterop");
}

function buildWebUrls(port) {
  const routeAddress = getRoutePreferredIpv4Address();
  const firstAddress = getPrimaryIpv4Address();
  const networkAddress = routeAddress || firstAddress;
  const localhostUrl = `http://localhost:${port}/`;
  const routeUrl = routeAddress ? `http://${routeAddress}:${port}/` : null;
  const networkUrl = networkAddress ? `http://${networkAddress}:${port}/` : null;
  const browserUrl = hasHealthyWslInterop() ? localhostUrl : routeUrl || networkUrl || localhostUrl;

  return {
    wslUrl: `http://127.0.0.1:${port}/`,
    browserUrl,
    localhostUrl,
    routeUrl,
    networkUrl,
    interopHealthy: hasHealthyWslInterop(),
  };
}

async function resolveApiPlan() {
  const apiOrigin = getRequestedApiOrigin();
  const healthUrl = buildHealthUrl(apiOrigin);

  if (!isLocalOrigin(apiOrigin)) {
    return {
      apiOrigin,
      healthUrl,
      needsStart: false,
      reusedHealthyApi: true,
      reclaimedPort: false,
    };
  }

  if (await isHealthyApiReachable(healthUrl)) {
    return {
      apiOrigin,
      healthUrl,
      needsStart: false,
      reusedHealthyApi: true,
      reclaimedPort: false,
    };
  }

  const apiPort = getPortFromOrigin(apiOrigin);
  const reclaimedPort = await reclaimRepoPort(apiPort, "repo API", isRepoApiProcess);

  return {
    apiOrigin,
    healthUrl,
    needsStart: true,
    reusedHealthyApi: false,
    reclaimedPort,
  };
}

async function resolveWebPlan() {
  const host = getRequestedWebHost();
  const port = getRequestedWebPort();
  const reclaimedPort = await reclaimRepoPort(port, "repo preview", isRepoPreviewProcess);

  if (!(await checkPortAvailable(port))) {
    throw new Error(
      `[preview:prod] preview port ${port} is still unavailable. Override with MYGOBTI_PREVIEW_WEB_PORT if needed.`,
    );
  }

  return {
    host,
    port,
    reclaimedPort,
    probeUrl: `http://127.0.0.1:${port}/`,
    urls: buildWebUrls(port),
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
  const previewProxyTarget = getPreviewProxyTarget(apiPlan.apiOrigin);

  if (apiPlan.reusedHealthyApi) {
    console.log(`[preview:prod] reusing healthy API at ${apiPlan.healthUrl}`);
  } else if (apiPlan.reclaimedPort) {
    console.log(`[preview:prod] restarting API on stable port ${getPortFromOrigin(apiPlan.apiOrigin)}`);
  }

  console.log("[preview:prod] building web with VITE_API_BASE_URL=/api");
  await runCommand(["run", "build"], {
    VITE_API_BASE_URL: "/api",
  });

  if (apiPlan.needsStart) {
    const apiProcess = spawnChild(
      npmCommand,
      ["run", "start", "--workspace", "apps/api"],
      {
        PORT: String(getPortFromOrigin(apiPlan.apiOrigin)),
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
      String(webPlan.port),
      "--strictPort",
    ],
    {
      VITE_API_PROXY_TARGET: previewProxyTarget,
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

  await waitForPreviewReady(webPlan.probeUrl, previewProcess);

  console.log(`[preview:prod] wsl: ${webPlan.urls.wslUrl}`);
  console.log(`[preview:prod] browser: ${webPlan.urls.browserUrl}`);
  console.log(`[preview:prod] localhost: ${webPlan.urls.localhostUrl}`);
  if (webPlan.urls.routeUrl) {
    console.log(`[preview:prod] route: ${webPlan.urls.routeUrl}`);
  }
  if (webPlan.urls.networkUrl) {
    console.log(`[preview:prod] network: ${webPlan.urls.networkUrl}`);
  }
  if (!webPlan.urls.interopHealthy) {
    console.warn(
      "[preview:prod] WSL Windows interop looks unhealthy; prefer browser/route URL over localhost.",
    );
  }
  console.log(`[preview:prod] api: ${apiBaseUrl}`);
  console.log(
    `[preview:prod:ready] ${JSON.stringify({
      wslUrl: webPlan.urls.wslUrl,
      browserUrl: webPlan.urls.browserUrl,
      localhostUrl: webPlan.urls.localhostUrl,
      routeUrl: webPlan.urls.routeUrl,
      networkUrl: webPlan.urls.networkUrl,
      wslInteropHealthy: webPlan.urls.interopHealthy,
      apiBaseUrl,
      apiHealthUrl: apiPlan.healthUrl,
    })}`,
  );
}

main().catch((error) => {
  console.error(`${error instanceof Error ? error.message : String(error)}`);
  terminateChildren();
  process.exit(1);
});
