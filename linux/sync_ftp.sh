#!/bin/bash
# KeePass Sync - Linux (calls Node.js)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BASE_DIR"

if command -v node &>/dev/null && [ -f "sync.js" ]; then
    node sync.js "$@"
    exit $?
fi

echo "Error: Node.js or sync.js not found."
echo "Install Node.js 18+ and run from project root: node sync.js"
exit 1
