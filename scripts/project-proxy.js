/**
 * Project Proxy — Cold-start reverse proxy for dynamic projects
 * Compiled version for VPS (Node.js, no TypeScript needed at runtime)
 */

const http = require("http");
const fs = require("fs");
const { execSync, exec } = require("child_process");

const PORT = 10099;
const REGISTRY_PATH = "/var/www/projects/registry.json";
const VISITOR_LOG_PATH = "/var/www/projects/visitors.json";
const CHECK_INTERVAL_MS = 60000;
const COLD_START_TIMEOUT_MS = 15000;

const containerStarting = new Map();

function readRegistry() {
    try {
        return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    } catch {
        return { projects: {}, nextPort: 10001, settings: { defaultIdleTimeout: 3600 } };
    }
}

function writeRegistry(reg) {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2));
}

function updateLastAccess(slug) {
    const reg = readRegistry();
    if (reg.projects[slug]) {
        reg.projects[slug].lastAccess = new Date().toISOString();
        reg.projects[slug].visitors = (reg.projects[slug].visitors || 0) + 1;
        writeRegistry(reg);
    }
}

function logVisitor(slug, req) {
    const entry = {
        timestamp: new Date().toISOString(),
        slug,
        ip: req.headers["x-real-ip"] || req.socket.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        path: req.url || "/",
    };

    let visitors = [];
    try { visitors = JSON.parse(fs.readFileSync(VISITOR_LOG_PATH, "utf8")); } catch { }
    visitors.push(entry);
    if (visitors.length > 10000) visitors = visitors.slice(-10000);
    fs.writeFileSync(VISITOR_LOG_PATH, JSON.stringify(visitors));
}

function isContainerRunning(name) {
    try {
        return execSync(`docker inspect -f '{{.State.Status}}' ${name} 2>/dev/null`, { encoding: "utf8" }).trim() === "running";
    } catch { return false; }
}

function startContainer(name) {
    const existing = containerStarting.get(name);
    if (existing) return existing;

    const promise = new Promise((resolve) => {
        console.log(`[proxy] Cold-starting: ${name}`);
        exec(`docker start ${name}`, (err) => {
            if (err) { containerStarting.delete(name); resolve(false); return; }
            let attempts = 0;
            const check = setInterval(() => {
                attempts++;
                if (isContainerRunning(name)) {
                    clearInterval(check);
                    setTimeout(() => { containerStarting.delete(name); resolve(true); }, 1500);
                } else if (attempts * 500 > COLD_START_TIMEOUT_MS) {
                    clearInterval(check);
                    containerStarting.delete(name);
                    resolve(false);
                }
            }, 500);
        });
    });
    containerStarting.set(name, promise);
    return promise;
}

function stopContainer(name) {
    try { execSync(`docker stop ${name} 2>/dev/null`); console.log(`[proxy] Stopped: ${name}`); } catch { }
}

function checkIdleContainers() {
    const reg = readRegistry();
    const now = Date.now();
    for (const [slug, p] of Object.entries(reg.projects)) {
        if (p.type !== "dynamic" || p.idleTimeout <= 0) continue;
        const last = new Date(p.lastAccess || p.created).getTime();
        if (now - last > p.idleTimeout * 1000 && isContainerRunning(p.container)) {
            console.log(`[proxy] Idle stop: ${p.container} (${Math.round((now - last) / 60000)}m)`);
            stopContainer(p.container);
        }
    }
}

async function handleProxy(req, res) {
    const match = (req.url || "").match(/^\/proxy\/([a-z0-9-]+)\/(.*)?$/);
    if (!match) { res.writeHead(404); res.end("Not Found"); return; }

    const slug = match[1];
    const remaining = "/" + (match[2] || "");
    const reg = readRegistry();
    const project = reg.projects[slug];

    if (!project || project.type !== "dynamic") {
        res.writeHead(404); res.end(`Project '${slug}' not found`); return;
    }

    logVisitor(slug, req);
    updateLastAccess(slug);

    if (!isContainerRunning(project.container)) {
        res.writeHead(200, { "Content-Type": "text/html", "Refresh": "3" });
        res.end(`<!DOCTYPE html><html><head><title>${slug} — Starting...</title>
<style>body{background:#0a0a0f;color:#e2e8f0;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh}
.box{text-align:center}.spinner{display:inline-block;width:40px;height:40px;border:3px solid #1f2937;border-top-color:#60a5fa;border-radius:50%;animation:spin .8s linear infinite;margin-bottom:1rem}
@keyframes spin{to{transform:rotate(360deg)}}h2{font-size:1.25rem;margin-bottom:.5rem}p{color:#64748b;font-size:.875rem}</style></head>
<body><div class="box"><div class="spinner"></div><h2>🚀 Starting ${slug}...</h2><p>Cold-starting container. Page will refresh automatically.</p></div></body></html>`);
        startContainer(project.container);
        return;
    }

    const proxyReq = http.request({
        hostname: "127.0.0.1", port: project.port, path: remaining,
        method: req.method, headers: { ...req.headers, host: `127.0.0.1:${project.port}` },
    }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });
    proxyReq.on("error", () => {
        res.writeHead(502); res.end(`Project '${slug}' not responding.`);
    });
    req.pipe(proxyReq, { end: true });
}

function handleAPI(req, res) {
    const url = req.url || "";
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

    if (url === "/api/projects" && req.method === "GET") {
        const reg = readRegistry();
        const projects = Object.entries(reg.projects).map(([slug, p]) => ({
            slug, ...p,
            status: p.type === "dynamic" ? (isContainerRunning(p.container) ? "running" : "stopped") : "active",
        }));
        res.writeHead(200);
        res.end(JSON.stringify({ projects, settings: reg.settings }));
        return;
    }

    const statsMatch = url.match(/^\/api\/projects\/([a-z0-9-]+)\/stats$/);
    if (statsMatch && req.method === "GET") {
        const slug = statsMatch[1];
        let visitors = [];
        try { visitors = JSON.parse(fs.readFileSync(VISITOR_LOG_PATH, "utf8")); } catch { }
        const pv = visitors.filter(v => v.slug === slug);
        const h24 = pv.filter(v => Date.now() - new Date(v.timestamp).getTime() < 86400000);
        const devices = {};
        for (const v of h24) {
            const d = /mobile|android|iphone/i.test(v.userAgent) ? "Mobile" : /tablet|ipad/i.test(v.userAgent) ? "Tablet" : "Desktop";
            devices[d] = (devices[d] || 0) + 1;
        }
        res.writeHead(200);
        res.end(JSON.stringify({ total: pv.length, last24h: h24.length, uniqueVisitors24h: new Set(h24.map(v => v.ip)).size, devices, recentVisitors: h24.slice(-20).reverse() }));
        return;
    }

    const actionMatch = url.match(/^\/api\/projects\/([a-z0-9-]+)\/(restart|stop|start)$/);
    if (actionMatch && req.method === "POST") {
        const [, slug, action] = actionMatch;
        const reg = readRegistry();
        const p = reg.projects[slug];
        if (!p || p.type !== "dynamic") { res.writeHead(404); res.end(JSON.stringify({ error: "Not found" })); return; }
        if (action === "restart") { try { execSync(`docker restart ${p.container}`); res.writeHead(200); res.end(JSON.stringify({ ok: true })); } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); } }
        else if (action === "stop") { stopContainer(p.container); res.writeHead(200); res.end(JSON.stringify({ ok: true })); }
        else if (action === "start") { startContainer(p.container).then(ok => { res.writeHead(ok ? 200 : 500); res.end(JSON.stringify({ ok })); }); }
        return;
    }

    if (url === "/api/settings" && req.method === "PATCH") {
        let body = ""; req.on("data", c => body += c); req.on("end", () => {
            try {
                const u = JSON.parse(body); const reg = readRegistry();
                if (u.defaultIdleTimeout !== undefined) reg.settings.defaultIdleTimeout = Number(u.defaultIdleTimeout);
                writeRegistry(reg);
                res.writeHead(200); res.end(JSON.stringify({ ok: true, settings: reg.settings }));
            } catch (e) { res.writeHead(400); res.end(JSON.stringify({ error: e.message })); }
        }); return;
    }

    const patchMatch = url.match(/^\/api\/projects\/([a-z0-9-]+)$/);
    if (patchMatch && req.method === "PATCH") {
        const slug = patchMatch[1];
        let body = ""; req.on("data", c => body += c); req.on("end", () => {
            try {
                const u = JSON.parse(body); const reg = readRegistry();
                if (!reg.projects[slug]) { res.writeHead(404); res.end(JSON.stringify({ error: "Not found" })); return; }
                if (u.idleTimeout !== undefined) reg.projects[slug].idleTimeout = Number(u.idleTimeout);
                if (u.description !== undefined) reg.projects[slug].description = u.description;
                writeRegistry(reg);
                res.writeHead(200); res.end(JSON.stringify({ ok: true, project: reg.projects[slug] }));
            } catch (e) { res.writeHead(400); res.end(JSON.stringify({ error: e.message })); }
        }); return;
    }

    res.writeHead(404); res.end(JSON.stringify({ error: "Not found" }));
}

const server = http.createServer(async (req, res) => {
    const url = req.url || "";
    if (url.startsWith("/api/")) handleAPI(req, res);
    else if (url.startsWith("/proxy/")) await handleProxy(req, res);
    else if (url === "/health") { res.writeHead(200); res.end(JSON.stringify({ status: "ok", uptime: process.uptime() })); }
    else { res.writeHead(404); res.end("Not Found"); }
});

server.listen(PORT, "127.0.0.1", () => {
    console.log(`[project-proxy] Listening on 127.0.0.1:${PORT}`);
    setInterval(checkIdleContainers, CHECK_INTERVAL_MS);
});
