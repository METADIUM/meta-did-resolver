#!/usr/bin/env bash
# gitleaks pre-commit 훅을 이 저장소에 설치한다. (2026-09-09)
#
# 배경: 2026-09-09 에 저장소에서 살아있는 자격증명 2종을 포함해 평문 6종이 나왔다.
#       PR #47(backend)·#97(frontend) 로 걷어냈지만, 재발 방지 장치가 없었다.
#       Bitbucket Pipelines 는 러너가 없어 꺼져 있으므로(docs/PROD-DEPLOY.md 8-1)
#       CI 차단이 불가능하다 → 로컬 pre-commit 이 유일한 자동 방어선이다.
#
# 하는 일
#   1) gitleaks 가 없으면 받아서 ~/bin 에 넣는다
#   2) core.hooksPath 를 hooks/ 로 돌린다 (훅이 git 으로 관리돼 사라지지 않는다)
#
# 되돌리기:  git config --unset core.hooksPath
set -euo pipefail

GITLEAKS_VERSION=8.28.0
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

# ── 1) gitleaks ──────────────────────────────────────────────────────────
if command -v gitleaks >/dev/null 2>&1 || [ -x "$HOME/bin/gitleaks" ]; then
  BIN=$(command -v gitleaks || echo "$HOME/bin/gitleaks")
  echo "gitleaks 있음: $BIN ($("$BIN" version))"
else
  echo "gitleaks 설치 중 (v${GITLEAKS_VERSION} → ~/bin)"
  case "$(uname -s)/$(uname -m)" in
    Linux/x86_64)  ASSET="gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" ;;
    Linux/aarch64) ASSET="gitleaks_${GITLEAKS_VERSION}_linux_arm64.tar.gz" ;;
    Darwin/arm64)  ASSET="gitleaks_${GITLEAKS_VERSION}_darwin_arm64.tar.gz" ;;
    Darwin/x86_64) ASSET="gitleaks_${GITLEAKS_VERSION}_darwin_x64.tar.gz" ;;
    *) echo "지원하지 않는 플랫폼: $(uname -s)/$(uname -m) — 수동 설치하세요"; exit 1 ;;
  esac
  TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
  curl -sSL -o "$TMP/g.tar.gz" \
    "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/${ASSET}"
  tar xzf "$TMP/g.tar.gz" -C "$TMP" gitleaks
  mkdir -p "$HOME/bin" && install -m 755 "$TMP/gitleaks" "$HOME/bin/gitleaks"
  echo "  설치됨: ~/bin/gitleaks ($("$HOME/bin/gitleaks" version))"
  case ":$PATH:" in *":$HOME/bin:"*) ;; *) echo "  ⚠️ ~/bin 이 PATH 에 없습니다 — 훅은 직접 찾으니 동작합니다" ;; esac
fi

# ── 2) 훅 연결 ───────────────────────────────────────────────────────────
link_hooks() {  # $1 = 저장소 경로
  local repo=$1 name=${2:-$(basename "$1")}
  if [ ! -d "$repo/hooks" ]; then
    echo "  $name: hooks/ 없음 — 건너뜀"
    return
  fi
  chmod +x "$repo/hooks/"* 2>/dev/null || true
  git -C "$repo" config core.hooksPath hooks
  echo "  $name: core.hooksPath=hooks ✓"
}

echo "훅 연결"
link_hooks "$ROOT" "$(basename "$ROOT")"
if [ -f "$ROOT/.gitmodules" ]; then
  while read -r sm; do
    [ -n "$sm" ] && link_hooks "$ROOT/$sm" "$sm"
  done < <(git -C "$ROOT" config -f .gitmodules --get-regexp '^submodule\..*\.path$' | awk '{print $2}')
fi

echo
echo "완료. 확인:"
# ★예시에 실제 토큰을 쓰지 않는다 — 훅이 이 파일 자신을 막는다(실제로 한 번 막혔다).
#   아래는 형태만 맞춘 가짜 값이다.
echo "  printf \"t: '1234567890:AA\$(head -c 24 /dev/urandom | base64 | tr -d /+= | head -c 33)'\\n\" > /tmp/x.yml"
echo "  cp /tmp/x.yml . && git add x.yml && git commit -m test   # ← 막혀야 정상"
echo "  git reset x.yml && rm -f x.yml /tmp/x.yml"
