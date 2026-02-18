/**
 * Project Proxy — Cold-start reverse proxy for dynamic projects
 *
 * Handles:
 * 1. Cold-start: auto-starts stopped Docker containers on first request
 * 2. Visitor tracking: counts unique visitors, logs device info
 * 3. Idle timeout: stops containers after configurable idle period
 * 4. Health monitoring: tracks container status
 *
 * Runs on port 10099, receives proxied requests from nginx /p/d/ location
 */

import * as http from "http";
import * as fs from "fs";
import { execSync, exec } from "child_process";

// ── Config ──

const PORT = 10099;
const REGISTRY_PATH = "/var/www/projects/registry.json";
const VISITOR_LOG_PATH = "/var/www/projects/visitors.json";
const CHECK_INTERVAL_MS = 60_000; // check idle containers every 60s
const COLD_START_TIMEOUT_MS = 15_000; // max wait for container to start

// ── Types ──

interface ProjectEntry {
    type: string;
    port: number;
    container: string;
    idleTimeout: number;
    visitors: number;
    lastAccess: string;
    description?: string;
    created: string;
}

interface Registry {
    projects: Record<string, ProjectEntry>;
    nextPort: number;
    settings: { defaultIdleTimeout: number };
}

interface VisitorEntry {
    timestamp: string;
    slug: string;
    ip: string;
    userAgent: string;
    path: string;
}

// ── State ──

const containerStarting = new Map<string, Promise<boolean>>();

// ── Registry ──

function readRegistry(): Registry {
    try {
        return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    } catch {
        return { projects: {}, nextPort: 10001, settings: { defaultIdleTimeout: 3600 } };
    }
}

function writeRegistry(reg: Registry): void {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2));
}

function updateLastAccess(slug: string): void {
    const reg = readRegistry();
    if (reg.projects[slug]) {
        reg.projects[slug].lastAccess = new Date().toISOString();
        reg.projects[slug].visitors = (reg.projects[slug].visitors || 0) + 1;
        writeRegistry(reg);
    }
}

// ── Visitor Tracking ──

function logVisitor(slug: string, req: http.IncomingMessage): void {
    const entry: VisitorEntry = {
        timestamp: new Date().toISOString(),
        slug,
        ip: (req.headers["x-real-ip"] as string) || req.socket.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        path: req.url || "/",
    };

    let visitors: VisitorEntry[] = [];
    try {
        visitors = JSON.parse(fs.readFileSync(VISITOR_LOG_PATH, "utf8"));
    } catch {
        // file doesn't exist yet
    }

    visitors.push(entry);

    // Keep last 10000 entries
    if (visitors.length > 10000) {
        visitors = visitors.slice(-10000);
    }

    fs.writeFileSync(VISITOR_LOG_PATH, JSON.stringify(visitors, null, 2));
}

// ── Docker ──

function isContainerRunning(containerName: string): boolean {
    try {
        const status = execSync(
            `docker inspect -f '{{.State.Status}}' ${containerName} 2>/dev/null`,
            { encoding: "utf8" }
        ).trim();
        return status === "running";
    } catch {
        return false;
    }
}

function startContainer(containerName: string): Promise<boolean> {
    // Deduplicate concurrent start requests
    const existing = containerStarting.get(containerName);
    if (existing) return existing;

    const promise = new Promise<boolean>((resolve) => {
        console.log(`[proxy] Cold-starting container: ${containerName}`);
        exec(`docker start ${containerName}`, (err) => {
            if (err) {
                console.error(`[proxy] Failed to start ${containerName}:`, err.message);
                containerStarting.delete(containerName);
                resolve(false);
                return;
            }

            // Wait for container to be healthy
            let attempts = 0;
            const check = setInterval(() => {
                attempts++;
                if (isContainerRunning(containerName)) {
                    clearInterval(check);
                    console.log(`[proxy] Container ${containerName} started (${attempts * 500}ms)`);
                    // Small delay for app to bind port
                    setTimeout(() => {
                        containerStarting.delete(containerName);
                        resolve(true);
                    }, 1000);
                } else if (attempts * 500 > COLD_START_TIMEOUT_MS) {
                    clearInterval(check);
                    console.error(`[proxy] Timeout starting ${containerName}`);
                    containerStarting.delete(containerName);
                    resolve(false);
                }
            }, 500);
        });
    });

    containerStarting.set(containerName, promise);
    return promise;
}

function stopContainer(containerName: string): void {
    try {
        execSync(`docker stop ${containerName} 2>/dev/null`, { encoding: "utf8" });
        console.log(`[proxy] Stopped idle container: ${containerName}`);
    } catch {
        // already stopped
    }
}

// ── Idle Watchdog ──

function checkIdleContainers(): void {
    const reg = readRegistry();
    const now = Date.now();

    for (const [slug, project] of Object.entries(reg.projects)) {
        if (project.type !== "dynamic") continue;
        if (project.idleTimeout <= 0) continue; // 0 = never stop

        const lastAccess = new Date(project.lastAccess || project.created).getTime();
        const idleMs = now - lastAccess;

        if (idleMs > project.idleTimeout * 1000) {
            if (isContainerRunning(project.container)) {
                console.log(
                    `[proxy] Container ${project.container} idle for ${Math.round(idleMs / 60000)}m (timeout: ${project.idleTimeout}s) — stopping`
                );
                stopContainer(project.container);
            }
        }
    }
}

// ── Proxy Handler ──

async function handleProxy(
    req: http.IncomingMessage,
    res: http.ServerResponse
): Promise<void> {
    const url = req.url || "/";

    // Parse: /proxy/<slug>/... → slug + remaining path
    const match = url.match(/^\/proxy\/([a-z0-9-]+)\/(.*)?$/);
    if (!match) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
    }

    const slug = match[1];
    const remainingPath = "/" + (match[2] || "");

    const reg = readRegistry();
    const project = reg.projects[slug];

    if (!project || project.type !== "dynamic") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end(`Project '${slug}' not found`);
        return;
    }

    // Track visitor
    logVisitor(slug, req);
    updateLastAccess(slug);

    // Cold start if needed
    if (!isContainerRunning(project.container)) {
        res.writeHead(200, {
            "Content-Type": "text/html",
            "Refresh": "3",
        });
        res.end(`
            <html>
            <head><title>${slug} — Starting...</title>
            <style>
                body { background: #0a0a0f; color: #e2e8f0; font-family: Inter, sans-serif;
                       display: flex; align-items: center; justify-content: center; height: 100vh; }
                .box { text-align: center; }
                .spinner { display: inline-block; width: 40px; height: 40px; border: 3px solid #1f2937;
                           border-top-color: #60a5fa; border-radius: 50%;
                           animation: spin 0.8s linear infinite; margin-bottom: 1rem; }
                @keyframes spin { to { transform: rotate(360deg); } }
                h2 { font-size: 1.25rem; margin-bottom: 0.5rem; }
                p { color: #64748b; font-size: 0.875rem; }
            </style>
            </head>
            <body>
            <div class="box">
                <div class="spinner"></div>
                <h2>🚀 Starting ${slug}...</h2>
                <p>Cold-starting container. Page will refresh automatically.</p>
            </div>
            </body></html>
        `);

        // Start container in background for next request
        startContainer(project.container);
        return;
    }

    // Proxy to container
    const proxyReq = http.request(
        {
            hostname: "127.0.0.1",
            port: project.port,
            path: remainingPath,
            method: req.method,
            headers: {
                ...req.headers,
                host: `127.0.0.1:${project.port}`,
            },
        },
        (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
        }
    );

    proxyReq.on("error", (err) => {
        console.error(`[proxy] Error proxying to ${slug}:`, err.message);
        res.writeHead(502, { "Content-Type": "text/plain" });
        res.end(`Project '${slug}' is not responding. Try again in a moment.`);
    });

    req.pipe(proxyReq, { end: true });
}

// ── API Handler (for MC UI) ──

function handleAPI(
    req: http.IncomingMessage,
    res: http.ServerResponse
): void {
    const url = req.url || "/";
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    // GET /api/projects — list all projects with status
    if (url === "/api/projects" && req.method === "GET") {
        const reg = readRegistry();
        const projects = Object.entries(reg.projects).map(([slug, p]) => {
            let status = "active";
            if (p.type === "dynamic") {
                status = isContainerRunning(p.container) ? "running" : "stopped";
            }
            return { slug, ...p, status };
        });
        res.writeHead(200);
        res.end(JSON.stringify({ projects, settings: reg.settings }));
        return;
    }

    // GET /api/projects/:slug/stats
    const statsMatch = url.match(/^\/api\/projects\/([a-z0-9-]+)\/stats$/);
    if (statsMatch && req.method === "GET") {
        const slug = statsMatch[1];
        let visitors: VisitorEntry[] = [];
        try {
            visitors = JSON.parse(fs.readFileSync(VISITOR_LOG_PATH, "utf8"));
        } catch { /* empty */ }

        const projectVisitors = visitors.filter((v) => v.slug === slug);
        const last24h = projectVisitors.filter(
            (v) => Date.now() - new Date(v.timestamp).getTime() < 86400000
        );

        // Device breakdown
        const devices: Record<string, number> = {};
        for (const v of last24h) {
            const ua = v.userAgent;
            let device = "Desktop";
            if (/mobile|android|iphone/i.test(ua)) device = "Mobile";
            else if (/tablet|ipad/i.test(ua)) device = "Tablet";
            devices[device] = (devices[device] || 0) + 1;
        }

        // Unique IPs
        const uniqueIPs = new Set(last24h.map((v) => v.ip));

        res.writeHead(200);
        res.end(
            JSON.stringify({
                total: projectVisitors.length,
                last24h: last24h.length,
                uniqueVisitors24h: uniqueIPs.size,
                devices,
                recentVisitors: last24h.slice(-20).reverse(),
            })
        );
        return;
    }

    // POST /api/projects/:slug/restart
    const restartMatch = url.match(/^\/api\/projects\/([a-z0-9-]+)\/restart$/);
    if (restartMatch && req.method === "POST") {
        const slug = restartMatch[1];
        const reg = readRegistry();
        const project = reg.projects[slug];
        if (!project || project.type !== "dynamic") {
            res.writeHead(404);
            res.end(JSON.stringify({ error: "Dynamic project not found" }));
            return;
        }
        try {
            execSync(`docker restart ${project.container}`);
            res.writeHead(200);
            res.end(JSON.stringify({ ok: true, message: `${slug} restarted` }));
        } catch (e: any) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // POST /api/projects/:slug/stop
    const stopMatch = url.match(/^\/api\/projects\/([a-z0-9-]+)\/stop$/);
    if (stopMatch && req.method === "POST") {
        const slug = stopMatch[1];
        const reg = readRegistry();
        const project = reg.projects[slug];
        if (!project || project.type !== "dynamic") {
            res.writeHead(404);
            res.end(JSON.stringify({ error: "Dynamic project not found" }));
            return;
        }
        stopContainer(project.container);
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, message: `${slug} stopped` }));
        return;
    }

    // POST /api/projects/:slug/start
    const startMatch = url.match(/^\/api\/projects\/([a-z0-9-]+)\/start$/);
    if (startMatch && req.method === "POST") {
        const slug = startMatch[1];
        const reg = readRegistry();
        const project = reg.projects[slug];
        if (!project || project.type !== "dynamic") {
            res.writeHead(404);
            res.end(JSON.stringify({ error: "Dynamic project not found" }));
            return;
        }
        startContainer(project.container).then((ok) => {
            res.writeHead(ok ? 200 : 500);
            res.end(JSON.stringify({ ok, message: ok ? `${slug} started` : "Failed to start" }));
        });
        return;
    }

    // PATCH /api/settings — update global settings
    if (url === "/api/settings" && req.method === "PATCH") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
            try {
                const updates = JSON.parse(body);
                const reg = readRegistry();
                if (updates.defaultIdleTimeout !== undefined) {
                    reg.settings.defaultIdleTimeout = Number(updates.defaultIdleTimeout);
                }
                writeRegistry(reg);
                res.writeHead(200);
                res.end(JSON.stringify({ ok: true, settings: reg.settings }));
            } catch (e: any) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // PATCH /api/projects/:slug — update project settings
    const patchMatch = url.match(/^\/api\/projects\/([a-z0-9-]+)$/);
    if (patchMatch && req.method === "PATCH") {
        const slug = patchMatch[1];
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
            try {
                const updates = JSON.parse(body);
                const reg = readRegistry();
                if (!reg.projects[slug]) {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: "Not found" }));
                    return;
                }
                if (updates.idleTimeout !== undefined) {
                    reg.projects[slug].idleTimeout = Number(updates.idleTimeout);
                }
                if (updates.description !== undefined) {
                    reg.projects[slug].description = updates.description;
                }
                writeRegistry(reg);
                res.writeHead(200);
                res.end(JSON.stringify({ ok: true, project: reg.projects[slug] }));
            } catch (e: any) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
}

// ── Server ──

const server = http.createServer(async (req, res) => {
    const url = req.url || "/";

    if (url.startsWith("/api/")) {
        handleAPI(req, res);
    } else if (url.startsWith("/proxy/")) {
        await handleProxy(req, res);
    } else if (url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
    } else {
        res.writeHead(404);
        res.end("Not Found");
    }
});

server.listen(PORT, "127.0.0.1", () => {
    console.log(`[project-proxy] Listening on 127.0.0.1:${PORT}`);
    console.log(`[project-proxy] Idle check interval: ${CHECK_INTERVAL_MS / 1000}s`);

    // Start idle watchdog
    setInterval(checkIdleContainers, CHECK_INTERVAL_MS);
});
