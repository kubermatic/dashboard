#!/usr/bin/env bash
set -euo pipefail

REL_ROOT_DIR="$(dirname "$0")/../"
ABS_ROOT_DIR="$(cd ${REL_ROOT_DIR}; pwd)"

${ABS_ROOT_DIR}/hack/run-in-docker.sh make install
${ABS_ROOT_DIR}/hack/run-in-docker.sh npm run start -- --host 0.0.0.0
