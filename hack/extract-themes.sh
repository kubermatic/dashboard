#!/usr/bin/env bash
set -euo pipefail

REL_ROOT_DIR="$(dirname "$0")/.."
ABS_ROOT_DIR="$(cd ${REL_ROOT_DIR}; pwd)"

rm -rf ${REL_ROOT_DIR}/themes
mkdir ${REL_ROOT_DIR}/themes
cp -r ${REL_ROOT_DIR}/dist/assets/themes/*.css ${REL_ROOT_DIR}/themes
