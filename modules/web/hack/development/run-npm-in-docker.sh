#!/usr/bin/env bash

# Copyright 2020 The Kubermatic Kubernetes Platform contributors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Configuration
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KUBERMATIC_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
LOCAL_UID=$(id -u)
LOCAL_GID=$(id -g)
KUBERMATIC_NPM_CMD=${KUBERMATIC_NPM_CMD:-$*}
KUBERMATIC_PORT="8000"
KUBERMATIC_SRC_DIR="${KUBERMATIC_DIR}/src"
KUBERMATIC_CONTAINER_SRC_DIR="/dashboard/src"
KUBERMATIC_CONTAINER_NAME=${KUBERMATIC_CONTAINER_NAME:-"k8c-dashboard-dev-container"}
KUBERMATIC_IMAGE_NAME=${KUBERMATIC_IMAGE_NAME:-"k8c-dashboard-dev-image"}

echo "Start building container image for development"
docker build -t "${KUBERMATIC_IMAGE_NAME}" -f "${DIR}"/Dockerfile "${DIR}"/../../

echo "Run container for development"
docker run \
  -it \
  --rm \
  --name="${KUBERMATIC_CONTAINER_NAME}" \
  --cap-add=SYS_PTRACE \
  -v "${KUBERMATIC_SRC_DIR}":"${KUBERMATIC_CONTAINER_SRC_DIR}" \
  -e LOCAL_UID="${LOCAL_UID}" \
  -e LOCAL_GID="${LOCAL_GID}" \
  -e NODE_OPTIONS="--max-old-space-size=8192" \
  -e KUBERMATIC_NPM_CMD="${KUBERMATIC_NPM_CMD}" \
  -p ${KUBERMATIC_PORT}:${KUBERMATIC_PORT} \
  "${KUBERMATIC_IMAGE_NAME}"
