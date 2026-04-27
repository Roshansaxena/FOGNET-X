#!/bin/bash
# =============================================================================
# FOGNET-X RPM Package Builder
# =============================================================================
# Creates a .rpm package for RHEL/CentOS/Fedora systems
# Usage: ./build_rpm.sh [version]
# =============================================================================

set -e

VERSION=${1:-"1.0.0"}
ARCH="x86_64"
PACKAGE_NAME="fognetx"

echo "Building FOGNET-X RPM Package v${VERSION}..."

# Create build directories
BUILD_DIR="/tmp/fognetx-rpm-build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"/{SOURCES,SPECS,BUILD,RPMS,SRPMS}

# Create source tarball
cd ..
tar -czf "$BUILD_DIR/SOURCES/fognetx-${VERSION}.tar.gz" \
    --exclude='packaging' \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='*.log' \
    --exclude='__pycache__' \
    .

# Create spec file
cat > "$BUILD_DIR/SPECS/fognetx.spec" << EOF
Name:           fognetx
Version:        ${VERSION}
Release:        1%{?dist}
Summary:        Fog Computing Platform for Industry 4.0 IoT Orchestration
License:        MIT
URL:            https://github.com/your-org/fognetx
BuildArch:      noarch

Requires:       docker
Requires:       docker-compose

%description
FOGNET-X is an intelligent fog computing orchestration platform that makes
real-time, context-aware decisions about where to process IoT data - at the
edge (fog), in the cloud, or both.

Features:
- Real-time IoT device management
- Context-aware decision engine
- Multi-sensor fusion
- Automatic device registration
- WebSocket dashboard
- Email and Telegram alerts

%prep
%setup -q -n fognetx-${VERSION}

%install
mkdir -p %{buildroot}/opt/fognetx
mkdir -p %{buildroot}/var/lib/fognetx
mkdir -p %{buildroot}/var/log/fognetx
mkdir -p %{buildroot}/etc/fognetx
mkdir -p %{buildroot}/usr/lib/systemd/system

# Copy application files
cp -r * %{buildroot}/opt/fognetx/

# Install systemd service
cat > %{buildroot}/usr/lib/systemd/system/fognetx.service << 'SERVICEEOF'
[Unit]
Description=FOGNET-X Fog Computing Platform
Documentation=https://github.com/your-org/fognetx
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/fognetx
ExecStart=/usr/bin/docker-compose -C /etc/fognetx up -d
ExecStop=/usr/bin/docker-compose -C /etc/fognetx down
TimeoutSec=120

[Install]
WantedBy=multi-user.target
SERVICEEOF

%post
# Generate configuration
cd /opt/fognetx
if [ -f install.sh ]; then
    bash install.sh generate-config || true
fi

# Enable systemd service
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

%preun
if [ \$1 -eq 0 ]; then
    # Package removal
    systemctl stop fognetx || true
    systemctl disable fognetx || true
fi

%postun
if [ \$1 -ge 1 ]; then
    # Package upgrade
    systemctl try-restart fognetx || true
fi

%files
/opt/fognetx/*
/usr/lib/systemd/system/fognetx.service
%config(noreplace) /etc/fognetx

%changelog
* $(date +%a\ %b\ %d\ %Y) FOGNET-X Team <info@fognetx.io> - ${VERSION}-1
- Initial package release
EOF

# Build the RPM package
cd "$BUILD_DIR"
rpmbuild -ba SPECS/fognetx.spec

# Move to output directory
OUTPUT_DIR="../packaging/rpms"
mkdir -p "$OUTPUT_DIR"
find RPMS -name "*.rpm" -exec mv {} "$OUTPUT_DIR/" \;
find SRPMS -name "*.rpm" -exec mv {} "$OUTPUT_DIR/" \;

echo ""
echo "✅ RPM package built successfully!"
echo "Location: $OUTPUT_DIR/"
ls -lh "$OUTPUT_DIR/"
echo ""
echo "To install:"
echo "  sudo rpm -ivh $OUTPUT_DIR/fognetx-${VERSION}-1.*.rpm"
echo "  OR"
echo "  sudo yum localinstall $OUTPUT_DIR/fognetx-${VERSION}-1.*.rpm"
echo ""
