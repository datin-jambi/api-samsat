#!/bin/bash
# ======================================
# BPKPD API - All-in-One Management Script
# ======================================
# Usage:
#   ./app.sh deploy    - Deploy/update aplikasi
#   ./app.sh rollback  - Rollback ke versi sebelumnya
#   ./app.sh start     - Start aplikasi
#   ./app.sh stop      - Stop aplikasi
#   ./app.sh restart   - Restart aplikasi
#   ./app.sh status    - Cek status aplikasi
#   ./app.sh logs      - Lihat logs

set -e

COMMAND=$1
APP_NAME="bpkpd-api"
BACKUP_DIR="backups"

# ======================================
# FUNCTIONS
# ======================================

show_help() {
    echo ""
    echo "BPKPD API Management"
    echo ""
    echo "Usage:"
    echo "  ./app.sh deploy    - Deploy/update aplikasi dari GitHub"
    echo "  ./app.sh rollback  - Rollback ke versi sebelumnya"
    echo "  ./app.sh start     - Start aplikasi"
    echo "  ./app.sh stop      - Stop aplikasi"
    echo "  ./app.sh restart   - Restart aplikasi"
    echo "  ./app.sh status    - Cek status dan health"
    echo "  ./app.sh logs      - Lihat logs real-time"
    echo ""
}

do_rollback() {
    local TS=$1
    echo "Stopping..."
    docker-compose -f docker-compose.prod.yml down
    
    if [ -f "$BACKUP_DIR/.env.$TS" ]; then
        cp "$BACKUP_DIR/.env.$TS" ".env"
    fi
    
    if [ -f "$BACKUP_DIR/${APP_NAME}_${TS}.tar" ]; then
        docker load -i "$BACKUP_DIR/${APP_NAME}_${TS}.tar"
    fi
    
    echo "Starting..."
    docker-compose -f docker-compose.prod.yml up -d
    sleep 5
    
    if curl -s -o /dev/null http://localhost:3333/health 2>/dev/null; then
        echo "Rollback SUCCESS!"
    else
        echo "Rollback completed but health check failed"
    fi
}

deploy() {
    echo ""
    echo "=========================================="
    echo "  DEPLOYING BPKPD API"
    echo "=========================================="
    echo ""

    # Check prerequisites
    echo "[1/9] Checking prerequisites..."
    command -v git >/dev/null 2>&1 || { echo "ERROR: Git not found!"; exit 1; }
    command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker not found!"; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { echo "ERROR: Docker Compose not found!"; exit 1; }
    echo "OK"
    echo ""

    # Create backup
    echo "[2/9] Creating backup..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    mkdir -p "$BACKUP_DIR"
    
    if [ -f ".env" ]; then
        cp ".env" "$BACKUP_DIR/.env.$TIMESTAMP"
    fi
    
    docker save "$APP_NAME:latest" -o "$BACKUP_DIR/${APP_NAME}_${TIMESTAMP}.tar" 2>/dev/null || true
    echo "OK"
    echo ""

    # Stop containers
    echo "[3/9] Stopping containers..."
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    echo "OK"
    echo ""

    # Pull latest code
    echo "[4/9] Pulling from GitHub..."
    BRANCH=$(git branch --show-current)
    
    if [ -n "$(git status --porcelain)" ]; then
        git stash
    fi
    
    git pull origin "$BRANCH" || { echo "ERROR: Git pull failed!"; exit 1; }
    echo "OK"
    echo ""

    # Check .env
    echo "[5/9] Checking environment..."
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp ".env.example" ".env"
            echo "WARNING: Please update .env file!"
            read -p "Press enter to continue..."
        else
            echo "ERROR: No .env file found!"
            exit 1
        fi
    fi
    echo "OK"
    echo ""

    # Lint
    echo "[6/9] Running linter..."
    npm run lint >/dev/null 2>&1 || true
    echo "OK"
    echo ""

    # Build
    echo "[7/9] Building Docker image..."
    if ! docker-compose -f docker-compose.prod.yml build --no-cache; then
        echo "ERROR: Build failed!"
        read -p "Rollback? (y/n): " ROLLBACK
        if [ "$ROLLBACK" = "y" ] || [ "$ROLLBACK" = "Y" ]; then
            do_rollback "$TIMESTAMP"
        fi
        exit 1
    fi
    echo "OK"
    echo ""

    # Start
    echo "[8/9] Starting containers..."
    if ! docker-compose -f docker-compose.prod.yml up -d; then
        echo "ERROR: Start failed!"
        exit 1
    fi
    echo "OK"
    echo ""

    # Health check
    echo "[9/9] Health check..."
    sleep 5
    RETRY=0
    while [ $RETRY -lt 10 ]; do
        if curl -s -o /dev/null http://localhost:3333/health 2>/dev/null; then
            # Cleanup old backups (keep latest 10)
            ls -t "$BACKUP_DIR"/*.tar 2>/dev/null | tail -n +11 | xargs -r rm 2>/dev/null || true
            ls -t "$BACKUP_DIR"/.env.* 2>/dev/null | tail -n +11 | xargs -r rm 2>/dev/null || true
            
            echo ""
            echo "=========================================="
            echo "  DEPLOYMENT SUCCESS!"
            echo "=========================================="
            echo ""
            echo "Application: http://localhost:3333"
            echo "Rollback: ./app.sh rollback $TIMESTAMP"
            echo ""
            exit 0
        fi
        RETRY=$((RETRY + 1))
        sleep 3
    done
    
    echo "ERROR: Health check failed!"
    read -p "Rollback? (y/n): " ROLLBACK
    if [ "$ROLLBACK" = "y" ] || [ "$ROLLBACK" = "Y" ]; then
        do_rollback "$TIMESTAMP"
    fi
    exit 1
}

rollback() {
    echo ""
    echo "=========================================="
    echo "  ROLLBACK"
    echo "=========================================="
    echo ""

    TIMESTAMP=$2
    if [ -z "$TIMESTAMP" ]; then
        echo "Available backups:"
        COUNT=0
        for FILE in $(ls -t "$BACKUP_DIR"/*.tar 2>/dev/null); do
            BASENAME=$(basename "$FILE")
            TIME=${BASENAME#${APP_NAME}_}
            TIME=${TIME%.tar}
            echo "[$COUNT] $TIME"
            BACKUPS[$COUNT]=$TIME
            COUNT=$((COUNT + 1))
        done
        
        if [ $COUNT -eq 0 ]; then
            echo "No backups found!"
            exit 1
        fi
        
        read -p "Select: " SEL
        TIMESTAMP=${BACKUPS[$SEL]}
    fi

    read -p "Rollback to $TIMESTAMP? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Cancelled"
        exit 0
    fi

    do_rollback "$TIMESTAMP"
}

start_service() {
    echo "Starting..."
    docker-compose -f docker-compose.prod.yml up -d
    sleep 3
    show_status
}

stop_service() {
    echo "Stopping..."
    docker-compose -f docker-compose.prod.yml down
    echo "Stopped"
}

restart_service() {
    echo "Restarting..."
    docker-compose -f docker-compose.prod.yml restart
    sleep 3
    show_status
}

show_status() {
    echo ""
    echo "Service Status:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    if curl -s -o /dev/null http://localhost:3333/health 2>/dev/null; then
        echo "[OK] Application is healthy"
    else
        echo "[ERROR] Application not responding"
    fi
}

show_logs() {
    echo "Logs (Ctrl+C to exit):"
    docker-compose -f docker-compose.prod.yml logs -f --tail=100
}

# ======================================
# MAIN
# ======================================

case "$COMMAND" in
    deploy)
        deploy
        ;;
    rollback)
        rollback "$@"
        ;;
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    *)
        show_help
        exit 0
        ;;
esac
