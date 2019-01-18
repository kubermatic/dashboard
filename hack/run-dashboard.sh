#!/usr/bin/env bash
set -euo pipefail

REL_ROOT_DIR="$(dirname "$0")/../"
ABS_ROOT_DIR="$(realpath ${REL_ROOT_DIR})"

${ABS_ROOT_DIR}/hack/run-in-docker.sh make install
${ABS_ROOT_DIR}/hack/run-in-docker.sh npm run start -- --host 0.0.0.0
