#!/bin/bash
# =============================================================================
# Build script for FOGNET-X .NET applications
# =============================================================================

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         FOGNET-X .NET Build Script                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")"

# Check if .NET SDK is installed
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET SDK not found. Please install from: https://dotnet.microsoft.com/download"
    exit 1
fi

echo "✅ .NET SDK found: $(dotnet --version)"
echo ""

# Restore dependencies
echo "📦 Restoring NuGet packages..."
dotnet restore FogNetX.Manager/FogNetX.Manager.csproj
dotnet restore FogNetX.CLI/FogNetX.CLI.csproj
echo ""

# Build Manager (Windows Forms)
echo "🏗️ Building FOGNET-X Manager (Windows Desktop App)..."
dotnet build FogNetX.Manager/FogNetX.Manager.csproj -c Release
echo ""

# Build CLI (Cross-platform)
echo "🏗️ Building FOGNET-X CLI (Cross-platform tool)..."
dotnet build FogNetX.CLI/FogNetX.CLI.csproj -c Release
echo ""

# Publish Manager
echo "📦 Publishing Manager..."
dotnet publish FogNetX.Manager/FogNetX.Manager.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true
echo ""

# Publish CLI as global tool
echo "📦 Publishing CLI..."
dotnet pack FogNetX.CLI/FogNetX.CLI.csproj -c Release
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              Build Complete! ✅                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Output locations:"
echo "  Manager: packaging/dotnet/FogNetX.Manager/bin/Release/net8.0-windows/win-x64/publish/"
echo "  CLI Package: packaging/dotnet/FogNetX.CLI/bin/Release/*.nupkg"
echo ""
echo "To install CLI globally:"
echo "  dotnet tool install --global fognetx.cli"
echo ""
echo "To run Manager:"
echo "  Start-FOGNETX-Manager.exe (in publish folder)"
echo ""
