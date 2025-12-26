# Utility helpers for CI scripts

get_app_version() {
  # If a version is already provided, keep it.
  if [ -n "$1" ]; then
    echo "$1"
    return
  fi

  # Prefer CI tag, then branch, then git branch, else latest.
  if [ -n "$CI_COMMIT_TAG" ]; then
    echo "$CI_COMMIT_TAG"
    return
  fi

  if [ -n "$CI_COMMIT_BRANCH" ]; then
    echo "$CI_COMMIT_BRANCH"
    return
  fi

  local git_branch
  git_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  if [ -n "$git_branch" ] && [ "$git_branch" != "HEAD" ] && [ "$git_branch" != "master" ] && [ "$git_branch" != "main" ]; then
    echo "$git_branch"
  else
    echo "latest"
  fi
}

get_app_name() {
  # If an app name is already provided, keep it.
  if [ -n "$1" ]; then
    echo "$1"
    return
  fi

  # Use the git repository name as the app name.
  local repo_name
  repo_name="$(basename -s .git "$(git config --get remote.origin.url)" 2>/dev/null || true)"
  if [ -n "$repo_name" ]; then
    echo "$repo_name"
  else
    echo "myapp"
  fi
}

get_app_site() {
  # If an app site is already provided, keep it.
  if [ -n "$1" ]; then
    echo "$1"
    return
  fi

  # Use a default site based on the app name.
  local app_name
  app_name="$(get_app_name "$APP_NAME")"
  echo "${app_name}.apps.fringecoding.com"
}

get_package_manaher() {
  if [ -f "pnpm-lock.yaml" ]; then
    echo "pnpm"
  elif [ -f "yarn.lock" ]; then
    echo "yarn"
  elif [ -f "package-lock.json" ]; then
    echo "npm"
  else
    echo "npm"
  fi
}