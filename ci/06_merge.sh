#!/bin/sh

set -eu

REPO_ROOT=$(git rev-parse --show-toplevel)
MAIN_BRANCH="${MAIN_BRANCH:-main}"

cd "$REPO_ROOT"

echo "Fetching latest branches..."
git fetch origin --prune

release_branches=$(git for-each-ref --format='%(refname:short)' 'refs/remotes/origin/release/*' | sed 's|^origin/||' | sort -V)

if [ -z "$release_branches" ]; then
  echo "No release/* branches found."
  exit 1
fi

latest_branch=$(printf "%s\n" "$release_branches" | tail -n 1)
echo "Latest release branch: $latest_branch"

for branch in $release_branches; do
  if [ "$branch" = "$latest_branch" ]; then
    continue
  fi
  echo "Checking if $branch is merged into $latest_branch..."
  if ! git merge-base --is-ancestor "origin/$branch" "origin/$latest_branch"; then
    echo "Branch $branch is not fully merged into $latest_branch. Please merge it before proceeding."
    exit 1
  fi
done

echo "All release branches merged into $latest_branch. Proceeding to merge into $MAIN_BRANCH..."

git checkout "$MAIN_BRANCH"
git pull --ff-only origin "$MAIN_BRANCH"
git merge --ff-only "origin/$latest_branch"
git push origin "$MAIN_BRANCH"

echo "Merge of $latest_branch into $MAIN_BRANCH completed."
