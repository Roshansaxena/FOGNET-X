#!/bin/bash
# =============================================================================
# FOGNET-X Debian Package Builder
# =============================================================================
# Creates a .deb package for Ubuntu/Debian systems
# Usage: ./build_deb.sh [version]
# =============================================================================

set -e

VERSION=${1:-"1.0.0"}
ARCH="amd64"
PACKAGE_NAME="fognetx"
FULL_NAME="${PACKAGE_NAME}_${VERSION}_${ARCH}"

echo "Building FOGNET-X Debian Package v${VERSION}..."

# Create build directory
BUILD_DIR="/tmp/fognetx-build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/$FULL_NAME"

# Copy project files
cp -r ../backend "$BUILD_DIR/$FULL_NAME/"
cp -r ../frontend "$BUILD_DIR/$FULL_NAME/"
cp ../docker-compose.yml "$BUILD_DIR/$FULL_NAME/"
cp ../Dockerfile* "$BUILD_DIR/$FULL_NAME/"
cp install.sh "$BUILD_DIR/$FULL_NAME/"
cp uninstall.sh "$BUILD_DIR/$FULL_NAME/"

# Create DEBIAN control directory
mkdir -p "$BUILD_DIR/$FULL_NAME/DEBIAN"

# Create control file
cat > "$BUILD_DIR/$FULL_NAME/DEBIAN/control" << EOF
Package: fognetx
Version: ${VERSION}
Section: net
Priority: optional
Architecture: ${ARCH}
Depends: docker-ce, docker-compose
Maintainer: FOGNET-X Team <info@fognetx.io>
Homepage: https://github.com/your-org/fognetx
Description: Fog Computing Platform for Industry 4.0 IoT Orchestration
 FOGNET-X is an intelligent fog computing orchestration platform that makes
 real-time, context-aware decisions about where to process IoT data - at the
 edge (fog), in the cloud, or both.
 .
 Features:
  - Real-time IoT device management
  - Context-aware decision engine
  - Multi-sensor fusion
  - Automatic device registration
  - WebSocket dashboard
  - Email and Telegram alerts
EOF

# Create preinst script
cat > "$BUILD_DIR/$FULL_NAME/DEBIAN/preinst" << 'EOF'
#!/bin/bash
set -e

echo "Checking system requirements..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "ERROR: Docker daemon is not running."
    exit 1
fi

echo "System requirements satisfied."
exit 0
EOF

chmod +x "$BUILD_DIR/$FULL_NAME/DEBIAN/preinst"

# Create postinst script
cat > "$BUILD_DIR/$FULL_NAME/DEBIAN/postinst" << 'EOF'
#!/bin/bash
set -e

echo "Setting up FOGNET-X..."

# Create directories
mkdir -p /opt/fognetx
mkdir -p /var/lib/fognetx
mkdir -p /var/log/fognetx
mkdir -p /etc/fognetx

# Copy files
cp -r /usr/share/fognetx/* /opt/fognetx/

# Generate configuration
cd /opt/fognetx
./install.sh generate-config

# Setup systemd service
systemctl daemon-reload
systemctl enable fognetx

echo ""
echo "FOGNET-X installed successfully!"
echo "Access the dashboard at: http://localhost:3000"
echo ""
echo "Manage with:"
echo "  sudo systemctl start fognetx"
echo "  sudo systemctl stop fognetx"
echo "  sudo systemctl status fognetx"
echo ""

exit 0
EOF

chmod +x "$BUILD_DIR/$FULL_NAME/DEBIAN/postinst"

# Create prerm script
cat > "$BUILD_DIR/$FULL_NAME/DEBIAN/prerm" << 'EOF'
#!/bin/bash
set -e

echo "Stopping FOGNET-X services..."
systemctl stop fognetx || true
systemctl disable fognetx || true

exit 0
EOF

chmod +x "$BUILD_DIR/$FULL_NAME/DEBIAN/prerm"

# Create postrm script
cat > "$BUILD_DIR/$FULL_NAME/DEBIAN/postrm" << 'EOF'
#!/bin/bash
set -e

echo "Cleaning up FOGNET-X..."

# Remove containers (optional, ask user)
if [ "$1" = "purge" ]; then
    echo "Removing Docker containers and volumes..."
    docker rm -f $(docker ps -aq --filter name=fognetx) 2>/dev/null || true
    docker volume rm $(docker volume ls -q --filter name=fognetx) 2>/dev/null || true
    
    echo "Removing data directories..."
    rm -rf /var/lib/fognetx
    rm -rf /var/log/fognetx
    rm -rf /etc/fognetx
    rm -rf /opt/fognetx
fi

exit 0
EOF

chmod +x "$BUILD_DIR/$FULL_NAME/DEBIAN/postrm"

# Build the package
cd "$BUILD_DIR"
dpkg-deb --build "$FULL_NAME"

# Move to output directory
OUTPUT_DIR="../packaging/debs"
mkdir -p "$OUTPUT_DIR"
mv "$FULL_NAME.deb" "$OUTPUT_DIR/"

echo ""
echo "✅ Debian package built successfully!"
echo "Location: $OUTPUT_DIR/$FULL_NAME.deb"
echo ""
echo "To install:"
echo "  sudo dpkg -i $OUTPUT_DIR/$FULL_NAME.deb"
echo "  sudo apt-get install -f  # Fix dependencies if needed"
echo ""
