#!/usr/bin/env bash
set -euo pipefail

THEMES_DIR=dist-themes
REL_ROOT_DIR="$(dirname "$0")/.."
ABS_ROOT_DIR="$(cd ${REL_ROOT_DIR}; pwd)"

rm -rf ${REL_ROOT_DIR}/${THEMES_DIR}
mkdir ${REL_ROOT_DIR}/${THEMES_DIR}
cp -r ${REL_ROOT_DIR}/dist/assets/themes/*.css ${REL_ROOT_DIR}/${THEMES_DIR}
