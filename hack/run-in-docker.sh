#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="node:8.15-jessie"
REL_ROOT_DIR="$(dirname "$0")/../"
ABS_ROOT_DIR="$(realpath ${REL_ROOT_DIR})"

CMD="$@"
docker run \
  -u "$(id -u):$(id -g)" \
  -v ${ABS_ROOT_DIR}:/code \
  -w /code \
  -p 8000:8000 \
  -ti \
  ${IMAGE_NAME} \
  /bin/bash -c "${CMD}"
