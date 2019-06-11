#!/usr/bin/env bash
set -euo pipefail

COMMIT_SHA=${PULL_PULL_SHA:-$PULL_BASE_SHA}

bash <(curl -s https://codecov.io/bash) -c -K -C ${COMMIT_SHA} -b ${BUILD_ID}
