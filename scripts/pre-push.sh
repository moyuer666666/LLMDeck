#!/usr/bin/env sh
set -eu

tag_push=0

while read local_ref local_oid remote_ref remote_oid
do
  case "$remote_ref" in
    refs/tags/*)
      case "$local_oid" in
        0000000000000000000000000000000000000000)
          ;;
        *)
          tag_push=1
          ;;
      esac
      ;;
  esac
done

if [ "$tag_push" -ne 1 ]; then
  exit 0
fi

repo_root="$(git rev-parse --show-toplevel)"
app_dir="$repo_root/llmdeck-desktop"
release_dir="$app_dir/release"

if [ ! -d "$app_dir" ]; then
  echo "llmdeck-desktop directory was not found." >&2
  exit 1
fi

repo_root_real="$(cd "$repo_root" && pwd -P)"
app_dir_real="$(cd "$app_dir" && pwd -P)"

case "$app_dir_real" in
  "$repo_root_real"/*)
    ;;
  *)
    echo "Refusing to package outside the repository." >&2
    exit 1
    ;;
esac

echo "Tag push detected. Cleaning llmdeck-desktop/release..."
rm -rf "$release_dir"

echo "Running yarn package..."
cd "$app_dir"
yarn package
