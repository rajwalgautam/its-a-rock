#!/usr/bin/env bash
# deploy-pixel.sh
#
# Builds and deploys It's A Rock to a connected Android device over USB.
# Requirements:
#   - Android SDK with ADB on PATH  (brew install android-platform-tools on macOS)
#   - Android SDK with build tools  (via Android Studio or standalone SDK)
#   - Java 17+                      (required by Gradle)
#   - Node.js 18+
#   - USB Debugging enabled on the device
#
# Usage:
#   chmod +x scripts/deploy-pixel.sh
#   ./scripts/deploy-pixel.sh [--release]

set -euo pipefail

# ─── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Colour

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }

# ─── Parse Arguments ──────────────────────────────────────────────────────────
BUILD_VARIANT="debug"
for arg in "$@"; do
  case "$arg" in
    --release) BUILD_VARIANT="release" ;;
    --help|-h)
      echo "Usage: $0 [--release]"
      echo ""
      echo "  --release   Build a release APK instead of debug"
      exit 0
      ;;
  esac
done

# ─── Project Root ─────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

info "Project root: $PROJECT_ROOT"
info "Build variant: $BUILD_VARIANT"

# ─── Dependency Checks ────────────────────────────────────────────────────────
check_command() {
  if ! command -v "$1" &>/dev/null; then
    error "'$1' is not on PATH. $2"
    exit 1
  fi
}

check_command adb    "Install via: brew install android-platform-tools (macOS) or apt install adb (Linux)"
check_command node   "Install Node.js 18+ from https://nodejs.org"
check_command npx    "Comes with Node.js"
check_command java   "Install Java 17+ (e.g. brew install openjdk@17)"

# ─── ADB Device Detection ─────────────────────────────────────────────────────
info "Scanning for connected Android devices..."

DEVICE_LINE=$(adb devices | grep -E "^\S+\s+device$" | head -1 || true)

if [[ -z "$DEVICE_LINE" ]]; then
  error "No authorised Android device found."
  echo ""
  echo "  1. Connect your Android device via USB."
  echo "  2. Enable USB Debugging: Settings → Developer Options → USB Debugging."
  echo "  3. Accept the 'Allow USB debugging?' prompt on the device."
  exit 1
fi

DEVICE_SERIAL=$(echo "$DEVICE_LINE" | awk '{print $1}')
MODEL=$(adb -s "$DEVICE_SERIAL" shell getprop ro.product.model 2>/dev/null | tr -d '\r\n')
ANDROID_VER=$(adb -s "$DEVICE_SERIAL" shell getprop ro.build.version.release 2>/dev/null | tr -d '\r\n')

info "Found device: $MODEL (serial: $DEVICE_SERIAL, Android $ANDROID_VER)"
success "Device ready: $MODEL"

# ─── Node Dependencies ────────────────────────────────────────────────────────
info "Installing Node dependencies..."
npm install --silent

# ─── Run Tests ────────────────────────────────────────────────────────────────
info "Running tests..."
if npm test -- --passWithNoTests 2>&1; then
  success "All tests passed."
else
  error "Tests failed. Fix failing tests before deploying."
  exit 1
fi

# ─── Expo Prebuild ────────────────────────────────────────────────────────────
info "Running Expo prebuild (generates native Android project)..."
npx expo prebuild --platform android 2>&1 | tail -20
success "Prebuild complete."

# ─── Build & Install ──────────────────────────────────────────────────────────
info "Building $BUILD_VARIANT APK and installing on device $DEVICE_SERIAL..."
info "This may take 3–5 minutes on the first build (Gradle download)."

if [[ "$BUILD_VARIANT" == "release" ]]; then
  npx expo run:android \
    --device "$DEVICE_SERIAL" \
    --variant release 2>&1 | tail -40
else
  npx expo run:android \
    --device "$DEVICE_SERIAL" 2>&1 | tail -40
fi

success "It's A Rock ($BUILD_VARIANT) installed on $MODEL!"
info  "The app should launch automatically. If not, find 'It's A Rock' in your app drawer."
