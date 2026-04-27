#!/bin/bash
# =============================================================================
# FOGNET-X Uninstaller for Linux/macOS
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

INSTALL_DIR="/opt/fognetx"
DATA_DIR="/var/lib/fognetx"
LOG_DIR="/var/log/fognetx"
CONFIG_DIR="/etc/fognetx"
SERVICE_NAME="fognetx"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_banner() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║          FOGNET-X Uninstallation Wizard                   ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
}

confirm() {
    echo -n "Are you sure you want to uninstall FOGNET-X? [y/N]: "
    read -r response
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

stop_services() {
    log_info "Stopping FOGNET-X services..."
    
    if command -v systemctl &> /dev/null; then
        systemctl stop $SERVICE_NAME 2>/dev/null || true
        systemctl disable $SERVICE_NAME 2>/dev/null || true
    fi
    
    if [ -d "$CONFIG_DIR" ]; then
        cd "$CONFIG_DIR"
        docker-compose down 2>/dev/null || true
    fi
    
    log_success "Services stopped"
}

remove_containers() {
    log_info "Removing Docker containers..."
    
    docker rm -f $(docker ps -aq --filter name=fognetx) 2>/dev/null || true
    docker volume rm $(docker volume ls -q --filter name=fognetx) 2>/dev/null || true
    
    log_success "Containers removed"
}

remove_systemd_service() {
    if [ "$(uname)" == "Darwin" ]; then
        return
    fi
    
    log_info "Removing systemd service..."
    
    systemctl daemon-reload
    rm -f "/etc/systemd/system/$SERVICE_NAME.service"
    
    log_success "Systemd service removed"
}

remove_directories() {
    log_info "Removing directories..."
    
    rm -rf "$INSTALL_DIR"
    rm -rf "$DATA_DIR"
    rm -rf "$LOG_DIR"
    rm -rf "$CONFIG_DIR"
    
    log_success "Directories removed"
}

cleanup() {
    log_info "Cleaning up..."
    
    # Remove from PATH if added
    if grep -q "$INSTALL_DIR" ~/.bashrc 2>/dev/null; then
        sed -i '/fognetx/d' ~/.bashrc
    fi
    
    if grep -q "$INSTALL_DIR" ~/.zshrc 2>/dev/null; then
        sed -i '/fognetx/d' ~/.zshrc
    fi
    
    log_success "Cleanup completed"
}

post_uninstall() {
    echo ""
    log_success "╔═══════════════════════════════════════════════════════════╗"
    log_success "║         FOGNET-X Uninstallation Complete!                 ║"
    log_success "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "FOGNET-X has been completely removed from your system."
    echo ""
    echo "To reinstall, run:"
    echo "  curl -fsSL https://raw.githubusercontent.com/your-org/fognetx/main/install.sh | sudo bash"
    echo ""
}

main() {
    print_banner
    
    if ! confirm; then
        log_info "Uninstallation cancelled"
        exit 0
    fi
    
    stop_services
    remove_containers
    remove_systemd_service
    remove_directories
    cleanup
    post_uninstall
    
    log_success "Uninstallation completed successfully!"
}

main
