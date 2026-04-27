#!/bin/bash
# =============================================================================
# FOGNET-X Universal Installer for Linux/macOS
# =============================================================================
# One-command installation for FOGNET-X Fog Computing Platform
# Supports: Ubuntu, Debian, CentOS, RHEL, Fedora, macOS
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FOGNETX_VERSION="1.0.0"
INSTALL_DIR="/opt/fognetx"
DATA_DIR="/var/lib/fognetx"
LOG_DIR="/var/log/fognetx"
CONFIG_DIR="/etc/fognetx"
SERVICE_NAME="fognetx"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║           FOGNET-X Installation Wizard                    ║"
    echo "║        Fog Computing Platform for Industry 4.0            ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

check_root() {
    if [ "$EUID" -ne 0 ] && [ "$(uname)" != "Darwin" ]; then
        log_error "Please run as root (use sudo)"
        exit 1
    fi
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not found. Installing Docker..."
        install_docker
    else
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3)
        log_success "Docker found: $DOCKER_VERSION"
    fi
}

check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_warning "Docker Compose not found. Installing..."
        install_docker_compose
    else
        log_success "Docker Compose found"
    fi
}

install_docker() {
    log_info "Installing Docker..."
    
    if [ "$(uname)" == "Darwin" ]; then
        log_error "Please install Docker Desktop for macOS manually"
        echo "Visit: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    # Detect package manager
    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu
        apt-get update
        apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        yum install -y yum-utils
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        yum install -y docker-ce docker-ce-cli containerd.io
    elif command -v dnf &> /dev/null; then
        # Fedora
        dnf install -y dnf-plugins-core
        dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
        dnf install -y docker-ce docker-ce-cli containerd.io
    else
        log_error "Unsupported package manager. Please install Docker manually."
        exit 1
    fi
    
    systemctl start docker
    systemctl enable docker
    log_success "Docker installed successfully"
}

install_docker_compose() {
    COMPOSE_VERSION="v2.24.0"
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log_success "Docker Compose installed"
}

# =============================================================================
# Directory Setup
# =============================================================================

setup_directories() {
    log_info "Creating directories..."
    
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$DATA_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$CONFIG_DIR"
    
    # Set permissions
    chmod 755 "$INSTALL_DIR"
    chmod 755 "$DATA_DIR"
    chmod 755 "$LOG_DIR"
    chmod 755 "$CONFIG_DIR"
    
    log_success "Directories created"
}

# =============================================================================
# Configuration Generator
# =============================================================================

generate_config() {
    log_info "Generating configuration files..."
    
    # Generate .env file
    cat > "$CONFIG_DIR/.env" << 'EOF'
# FOGNET-X Configuration
FLASK_ENV=production
SECRET_KEY=fognetx_secret_key_change_in_production
DATABASE_URL=sqlite:///data/fognetx.db

# MQTT Configuration
MQTT_BROKER=mqtt
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Alert Configuration
ENABLE_EMAIL_ALERTS=false
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
ALERT_EMAIL=

# Telegram Alerts
ENABLE_TELEGRAM=false
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Network Configuration
FOG_NODE_IP=auto
API_PORT=8000
FRONTEND_PORT=3000

# Risk Thresholds
RISK_THRESHOLD=0.6
BATTERY_THRESHOLD_LOW=20
SIGNAL_STRENGTH_THRESHOLD=-85
NETWORK_LATENCY_THRESHOLD_MS=100
PACKET_LOSS_THRESHOLD_PCT=5

# SLA Configuration
SLA_FOG_MS=50
SLA_CLOUD_MS=1000
EOF

    # Generate docker-compose.yml
    cp "$INSTALL_DIR/docker-compose.yml" "$CONFIG_DIR/docker-compose.yml"
    
    log_success "Configuration files generated"
}

# =============================================================================
# Download FOGNET-X
# =============================================================================

download_fognetx() {
    log_info "Downloading FOGNET-X..."
    
    cd "$INSTALL_DIR"
    
    # Check if running from source
    if [ -f "../docker-compose.yml" ]; then
        log_info "Installing from local source..."
        cp -r ../backend ./
        cp -r ../frontend ./
        cp ../docker-compose.yml ./
        cp ../Dockerfile* ./
    else
        # Download from GitHub
        GITHUB_REPO="https://github.com/your-org/fognetx"
        curl -L "$GITHUB_REPO/archive/refs/tags/v$FOGNETX_VERSION.tar.gz" -o fognetx.tar.gz
        tar -xzf fognetx.tar.gz
        mv fognetx-$FOGNETX_VERSION/* .
        rm -rf fognetx.tar.gz fognetx-$FOGNETX_VERSION
    fi
    
    log_success "FOGNET-X downloaded"
}

# =============================================================================
# Systemd Service Setup
# =============================================================================

setup_systemd_service() {
    if [ "$(uname)" == "Darwin" ]; then
        log_info "Skipping systemd on macOS"
        return
    fi
    
    log_info "Setting up systemd service..."
    
    cat > "/etc/systemd/system/$SERVICE_NAME.service" << EOF
[Unit]
Description=FOGNET-X Fog Computing Platform
Documentation=https://github.com/your-org/fognetx
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$CONFIG_DIR
ExecStart=/usr/bin/docker-compose -f $CONFIG_DIR/docker-compose.yml up -d
ExecStop=/usr/bin/docker-compose -f $CONFIG_DIR/docker-compose.yml down
TimeoutSec=120

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    
    log_success "Systemd service created"
}

# =============================================================================
# Start Services
# =============================================================================

start_services() {
    log_info "Starting FOGNET-X services..."
    
    cd "$CONFIG_DIR"
    
    # Use docker compose or docker-compose based on availability
    if docker compose version &> /dev/null; then
        docker compose up -d
    else
        docker-compose up -d
    fi
    
    # Wait for services to be ready
    log_info "Waiting for services to initialize..."
    sleep 10
    
    log_success "FOGNET-X services started"
}

# =============================================================================
# Post-Installation
# =============================================================================

post_install() {
    echo ""
    log_success "╔═══════════════════════════════════════════════════════════╗"
    log_success "║         FOGNET-X Installation Complete! 🎉                ║"
    log_success "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "Services Status:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if command -v systemctl &> /dev/null; then
        systemctl status $SERVICE_NAME --no-pager
    fi
    
    echo ""
    echo "Access Points:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Frontend Dashboard: http://localhost:3000"
    echo "  Backend API:        http://localhost:8000"
    echo "  MQTT Broker:        localhost:1883"
    echo ""
    echo "Management Commands:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Start:      sudo systemctl start $SERVICE_NAME"
    echo "  Stop:       sudo systemctl stop $SERVICE_NAME"
    echo "  Restart:    sudo systemctl restart $SERVICE_NAME"
    echo "  Status:     sudo systemctl status $SERVICE_NAME"
    echo "  Logs:       sudo journalctl -u $SERVICE_NAME -f"
    echo ""
    echo "Docker Commands:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  View logs:     docker-compose -C $CONFIG_DIR logs -f"
    echo "  Stop all:      docker-compose -C $CONFIG_DIR down"
    echo "  Restart all:   docker-compose -C $CONFIG_DIR restart"
    echo ""
    echo "Configuration Location:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Config:  $CONFIG_DIR"
    echo "  Data:    $DATA_DIR"
    echo "  Logs:    $LOG_DIR"
    echo ""
    echo "Next Steps:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  1. Edit $CONFIG_DIR/.env with your settings"
    echo "  2. Configure alert credentials if needed"
    echo "  3. Connect ESP8266/ESP32 devices"
    echo "  4. Access dashboard at http://localhost:3000"
    echo ""
}

# =============================================================================
# Main Installation Flow
# =============================================================================

main() {
    print_banner
    
    log_info "Starting installation..."
    
    check_root
    check_docker
    check_docker_compose
    setup_directories
    download_fognetx
    generate_config
    setup_systemd_service
    start_services
    post_install
    
    log_success "Installation completed successfully!"
}

# Parse arguments
case "${1:-install}" in
    install)
        main
        ;;
    uninstall)
        exec "$INSTALL_DIR/uninstall.sh"
        ;;
    help)
        echo "FOGNET-X Installer Usage:"
        echo "  install   - Install FOGNET-X (default)"
        echo "  uninstall - Remove FOGNET-X"
        echo "  help      - Show this help"
        ;;
    *)
        log_error "Unknown option: $1"
        exit 1
        ;;
esac
