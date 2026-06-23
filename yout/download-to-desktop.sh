#!/bin/bash
# Run this on YOUR Mac to put everything on your Desktop
# Open Terminal and paste:
#   bash <(curl -s https://raw.githubusercontent.com/dissiks/dissi/cursor/car-culture-production-html-8d03/yout/download-to-desktop.sh)

set -e
DESKTOP="$HOME/Desktop"
FOLDER="$DESKTOP/yout"
REPO="https://github.com/dissiks/dissi.git"
BRANCH="cursor/car-culture-production-html-8d03"

echo "Creating yout folder on your Desktop..."
mkdir -p "$DESKTOP"
cd /tmp
rm -rf dissi-temp 2>/dev/null || true
git clone -b "$BRANCH" --depth 1 "$REPO" dissi-temp
rm -rf "$FOLDER"
mv dissi-temp/yout "$FOLDER"
rm -rf dissi-temp

echo ""
echo "DONE! Everything is here:"
echo "  $FOLDER"
echo ""
echo "Open video:"
echo "  $FOLDER/video-production/output/your-life-as-every-car-culture-rank.mp4"
echo ""
echo "Open script:"
echo "  $FOLDER/your-life-as-every-car-culture-rank.html"
open "$FOLDER" 2>/dev/null || true
