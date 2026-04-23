#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/backup-snapshot.sh [--dry-run] [--dest DIR]

Creates a Git snapshot backup outside the repository by default.
Artifacts:
  - repo.bundle
  - status.txt
  - working-tree.patch
  - index.patch
  - untracked.txt
  - untracked.tar.gz

Explicitly excludes:
  - .git-backups/
  - node_modules/
  - dist/
  - .planning/tmp/
EOF
}

DRY_RUN=0
DEST_ROOT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --dest)
      DEST_ROOT="${2:-}"
      if [[ -z "$DEST_ROOT" ]]; then
        echo "error: --dest requires a directory" >&2
        exit 1
      fi
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

REPO_ROOT="$(git rev-parse --show-toplevel)"
REPO_NAME="$(basename "$REPO_ROOT")"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

if [[ -z "$DEST_ROOT" ]]; then
  DEST_ROOT="${MYGOBTI_BACKUP_ROOT:-$HOME/git-backups/$REPO_NAME}"
fi

mkdir -p "$DEST_ROOT"
SNAPSHOT_DIR="$DEST_ROOT/$TIMESTAMP"

case "$SNAPSHOT_DIR/" in
  "$REPO_ROOT/"*)
    echo "error: backup destination must not be inside the repository: $SNAPSHOT_DIR" >&2
    exit 1
    ;;
esac

EXPLICIT_EXCLUDES=(
  ".git-backups/"
  "node_modules/"
  "dist/"
  ".planning/tmp/"
)

is_explicitly_excluded() {
  local path="$1"
  for prefix in "${EXPLICIT_EXCLUDES[@]}"; do
    if [[ "$path" == "$prefix"* ]]; then
      return 0
    fi
  done
  return 1
}

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
UNTRACKED_Z="$TMP_DIR/untracked.zlist"
UNTRACKED_TXT="$TMP_DIR/untracked.txt"

cd "$REPO_ROOT"
git ls-files --others --exclude-standard -z > "$UNTRACKED_Z"

python3 - "$UNTRACKED_Z" "$UNTRACKED_TXT" <<'PY'
import pathlib
import sys

src = pathlib.Path(sys.argv[1])
dst = pathlib.Path(sys.argv[2])
excluded = [
    ".git-backups/",
    "node_modules/",
    "dist/",
    ".planning/tmp/",
]

items = [p for p in src.read_bytes().split(b"\0") if p]
kept = []
for raw in items:
    path = raw.decode("utf-8", errors="surrogateescape")
    if any(path == prefix[:-1] or path.startswith(prefix) for prefix in excluded):
        continue
    kept.append(path)

dst.write_text("".join(f"{item}\n" for item in kept), encoding="utf-8")
src.write_bytes(b"\0".join(item.encode("utf-8", errors="surrogateescape") for item in kept) + (b"\0" if kept else b""))
PY

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "repo: $REPO_ROOT"
  echo "dest: $SNAPSHOT_DIR"
  echo "explicit excludes:"
  printf '  %s\n' "${EXPLICIT_EXCLUDES[@]}"
  echo "untracked files to archive:"
  if [[ -s "$UNTRACKED_TXT" ]]; then
    sed 's/^/  /' "$UNTRACKED_TXT"
  else
    echo "  <none>"
  fi
  exit 0
fi

mkdir -p "$SNAPSHOT_DIR"

git status --short --branch > "$SNAPSHOT_DIR/status.txt"
git rev-parse HEAD > "$SNAPSHOT_DIR/HEAD.txt"
git symbolic-ref --quiet --short HEAD > "$SNAPSHOT_DIR/branch.txt" || true
git diff > "$SNAPSHOT_DIR/working-tree.patch"
git diff --cached > "$SNAPSHOT_DIR/index.patch"
git bundle create "$SNAPSHOT_DIR/repo.bundle" --all
cp "$UNTRACKED_TXT" "$SNAPSHOT_DIR/untracked.txt"

if [[ -s "$UNTRACKED_Z" ]]; then
  tar -czf "$SNAPSHOT_DIR/untracked.tar.gz" --null -T "$UNTRACKED_Z"
else
  tar -czf "$SNAPSHOT_DIR/untracked.tar.gz" --files-from /dev/null
fi

echo "$SNAPSHOT_DIR"
