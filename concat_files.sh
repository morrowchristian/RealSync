#!/bin/bash

ROOT_DIR=$(pwd)
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"

# Output files
FRONTEND_OUTPUT="$ROOT_DIR/frontend_all_files.txt"
BACKEND_OUTPUT="$ROOT_DIR/backend_all_files.txt"

# ----------------------------
# Concatenate Frontend Files
# ----------------------------
echo "=== FRONTEND FILES ===" > "$FRONTEND_OUTPUT"

cd "$FRONTEND_DIR" || exit
find . \
    -type d \( -path './node_modules' -o -path './build' -o -path './dist' -o -path './.next' \) -prune -o \
    -type f -print | while read -r file; do
        echo -e "\n# FILE: $file" >> "$FRONTEND_OUTPUT"
        cat "$file" >> "$FRONTEND_OUTPUT"
    done
echo "✅ Frontend source files concatenated into $FRONTEND_OUTPUT"

# ----------------------------
# Concatenate Backend Files
# ----------------------------
echo "=== BACKEND FILES ===" > "$BACKEND_OUTPUT"

cd "$BACKEND_DIR" || exit
find . \
    -type d \( -path './migrations' -o -path './__pycache__' -o -path './static' -o -path './media' -o -path './venv' \) -prune -o \
    -type f ! -name 'db.sqlite3' -print | while read -r file; do
        echo -e "\n# FILE: $file" >> "$BACKEND_OUTPUT"
        cat "$file" >> "$BACKEND_OUTPUT"
    done
echo "✅ Backend source files concatenated into $BACKEND_OUTPUT"

echo "🎉 Concatenation complete! Auto-generated files excluded, and labels added."
