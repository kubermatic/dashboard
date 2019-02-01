#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="node:8.15-jessie"
REL_ROOT_DIR="$(dirname "$0")/../"
ABS_ROOT_DIR="$(cd ${REL_ROOT_DIR}; pwd)"

CMD="$@"
docker run \
  -u "$(id -u):$(id -g)" \
  -v ${ABS_ROOT_DIR}:/code \
  -w /code \
  --net=host \
  -ti \
  ${IMAGE_NAME} \
  /bin/bash -c "${CMD}"
