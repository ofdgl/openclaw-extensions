#!/bin/bash
# ═══════════════════════════════════════════════════════
# Project Manager — Create, delete, list projects
# Used by Coder agent to deploy web projects
# ═══════════════════════════════════════════════════════

set -euo pipefail

REGISTRY="/var/www/projects/registry.json"
STATIC_DIR="/var/www/projects/static"
DYNAMIC_DIR="/var/www/projects/dynamic"
NGINX_DIR="/etc/nginx/projects.d"
PROXY_PORT=10099  # cold-start proxy port

# ── Helpers ──

log() { echo "[project-manager] $*"; }
err() { echo "[project-manager] ERROR: $*" >&2; exit 1; }

validate_slug() {
    local slug="$1"
    [[ "$slug" =~ ^[a-z0-9][a-z0-9-]*[a-z0-9]$ ]] || [[ "$slug" =~ ^[a-z0-9]$ ]] \
        || err "Invalid slug: '$slug'. Use lowercase, numbers, hyphens only."
    [[ ${#slug} -le 32 ]] || err "Slug too long (max 32 chars)"
}

read_registry() {
    cat "$REGISTRY" 2>/dev/null || echo '{"projects":{},"nextPort":10001,"settings":{"defaultIdleTimeout":3600}}'
}

write_registry() {
    echo "$1" | python3 -m json.tool > "$REGISTRY"
}

get_project() {
    local slug="$1"
    read_registry | python3 -c "
import json, sys
d = json.load(sys.stdin)
p = d.get('projects', {}).get('$slug')
if p: print(json.dumps(p))
else: sys.exit(1)
" 2>/dev/null
}

# ── Commands ──

cmd_create() {
    local slug="$1"
    local type="${2:-static}"
    local desc="${3:-}"
    validate_slug "$slug"

    get_project "$slug" &>/dev/null && err "Project '$slug' already exists"

    local reg
    reg=$(read_registry)

    case "$type" in
        static)
            mkdir -p "$STATIC_DIR/$slug"
            echo '<html><body><h1>Project: '"$slug"'</h1><p>Replace this with your content.</p></body></html>' \
                > "$STATIC_DIR/$slug/index.html"

            reg=$(echo "$reg" | python3 -c "
import json, sys, datetime
d = json.load(sys.stdin)
d['projects']['$slug'] = {
    'type': 'static',
    'created': datetime.datetime.utcnow().isoformat() + 'Z',
    'description': '$desc',
    'visitors': 0
}
print(json.dumps(d))
")
            write_registry "$reg"
            log "Static project '$slug' created"
            log "URL: https://kamino.xn--merfaruk-m4a.com/p/$slug/"
            ;;

        dynamic)
            mkdir -p "$DYNAMIC_DIR/$slug/data"

            local port
            port=$(echo "$reg" | python3 -c "import json,sys; print(json.load(sys.stdin)['nextPort'])")

            # Create default Dockerfile if none exists
            if [ ! -f "$DYNAMIC_DIR/$slug/Dockerfile" ]; then
                cat > "$DYNAMIC_DIR/$slug/Dockerfile" << 'DEOF'
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production 2>/dev/null || true
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
DEOF
            fi

            # Build Docker image
            log "Building Docker image..."
            docker build -t "project-$slug" "$DYNAMIC_DIR/$slug" || err "Docker build failed"

            # Get idle timeout from settings
            local timeout
            timeout=$(echo "$reg" | python3 -c "import json,sys; print(json.load(sys.stdin).get('settings',{}).get('defaultIdleTimeout',3600))")

            # Run container
            log "Starting container on port $port..."
            docker run -d \
                --name "project-$slug" \
                --restart unless-stopped \
                --memory=256m \
                --cpus=0.5 \
                -p "127.0.0.1:$port:3000" \
                -v "$DYNAMIC_DIR/$slug/data:/app/data" \
                -e "PROJECT_SLUG=$slug" \
                -e "PORT=3000" \
                -l "project.slug=$slug" \
                -l "project.port=$port" \
                "project-$slug" || err "Docker run failed"

            # Generate nginx snippet
            cat > "$NGINX_DIR/$slug.conf" << NEOF
# Auto-generated for dynamic project: $slug
location /p/d/$slug/ {
    proxy_pass http://127.0.0.1:$PROXY_PORT/proxy/$slug/;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
}
NEOF

            # Update registry
            local next_port=$((port + 1))
            reg=$(echo "$reg" | python3 -c "
import json, sys, datetime
d = json.load(sys.stdin)
d['projects']['$slug'] = {
    'type': 'dynamic',
    'port': $port,
    'container': 'project-$slug',
    'created': datetime.datetime.utcnow().isoformat() + 'Z',
    'description': '$desc',
    'idleTimeout': $timeout,
    'visitors': 0,
    'lastAccess': datetime.datetime.utcnow().isoformat() + 'Z'
}
d['nextPort'] = $next_port
print(json.dumps(d))
")
            write_registry "$reg"

            # Reload nginx
            nginx -t && nginx -s reload
            log "Dynamic project '$slug' created on port $port"
            log "URL: https://kamino.xn--merfaruk-m4a.com/p/d/$slug/"
            ;;

        *)
            err "Unknown type: $type (use 'static' or 'dynamic')"
            ;;
    esac
}

cmd_delete() {
    local slug="$1"
    validate_slug "$slug"

    local project
    project=$(get_project "$slug") || err "Project '$slug' not found"
    local type
    type=$(echo "$project" | python3 -c "import json,sys; print(json.load(sys.stdin)['type'])")

    case "$type" in
        static)
            rm -rf "$STATIC_DIR/$slug"
            ;;
        dynamic)
            docker stop "project-$slug" 2>/dev/null || true
            docker rm "project-$slug" 2>/dev/null || true
            docker rmi "project-$slug" 2>/dev/null || true
            rm -rf "$DYNAMIC_DIR/$slug"
            rm -f "$NGINX_DIR/$slug.conf"
            nginx -t && nginx -s reload
            ;;
    esac

    # Remove from registry
    local reg
    reg=$(read_registry)
    reg=$(echo "$reg" | python3 -c "
import json, sys
d = json.load(sys.stdin)
d['projects'].pop('$slug', None)
print(json.dumps(d))
")
    write_registry "$reg"
    log "Project '$slug' deleted"
}

cmd_list() {
    local reg
    reg=$(read_registry)
    echo "$reg" | python3 -c "
import json, sys
d = json.load(sys.stdin)
projects = d.get('projects', {})
if not projects:
    print('No projects.')
    sys.exit(0)

print(f'{'Slug':<20} {'Type':<10} {'Status':<10} {'Port':<8} {'Visitors':<10} Description')
print('-' * 80)
for slug, p in sorted(projects.items()):
    ptype = p.get('type', '?')
    port = str(p.get('port', '-'))
    visitors = str(p.get('visitors', 0))
    desc = p.get('description', '')[:30]

    # Check container status for dynamic projects
    status = '-'
    if ptype == 'dynamic':
        import subprocess
        result = subprocess.run(['docker', 'inspect', '-f', '{{.State.Status}}', f'project-{slug}'],
                              capture_output=True, text=True)
        status = result.stdout.strip() if result.returncode == 0 else 'missing'

    print(f'{slug:<20} {ptype:<10} {status:<10} {port:<8} {visitors:<10} {desc}')
"
}

cmd_restart() {
    local slug="$1"
    local project
    project=$(get_project "$slug") || err "Project '$slug' not found"
    local type
    type=$(echo "$project" | python3 -c "import json,sys; print(json.load(sys.stdin)['type'])")

    [ "$type" = "dynamic" ] || err "Only dynamic projects can be restarted"

    docker restart "project-$slug"
    log "Project '$slug' restarted"
}

cmd_stop() {
    local slug="$1"
    local project
    project=$(get_project "$slug") || err "Project '$slug' not found"
    local type
    type=$(echo "$project" | python3 -c "import json,sys; print(json.load(sys.stdin)['type'])")

    [ "$type" = "dynamic" ] || err "Only dynamic projects can be stopped"

    docker stop "project-$slug"
    log "Project '$slug' stopped (will cold-start on next request)"
}

cmd_start() {
    local slug="$1"
    local project
    project=$(get_project "$slug") || err "Project '$slug' not found"
    local type
    type=$(echo "$project" | python3 -c "import json,sys; print(json.load(sys.stdin)['type'])")

    [ "$type" = "dynamic" ] || err "Only dynamic projects can be started"

    docker start "project-$slug"
    log "Project '$slug' started"
}

# ── Main ──

cmd="${1:-help}"
shift || true

case "$cmd" in
    create)  cmd_create "$@" ;;
    delete)  cmd_delete "$@" ;;
    list)    cmd_list ;;
    restart) cmd_restart "$@" ;;
    stop)    cmd_stop "$@" ;;
    start)   cmd_start "$@" ;;
    help|*)
        echo "Usage: project-manager.sh <command> [args]"
        echo ""
        echo "Commands:"
        echo "  create <slug> [static|dynamic] [description]"
        echo "  delete <slug>"
        echo "  list"
        echo "  restart <slug>"
        echo "  stop <slug>"
        echo "  start <slug>"
        echo ""
        echo "Static projects: https://kamino.xn--merfaruk-m4a.com/p/<slug>/"
        echo "Dynamic projects: https://kamino.xn--merfaruk-m4a.com/p/d/<slug>/"
        ;;
esac
