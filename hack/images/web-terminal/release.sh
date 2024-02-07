#!/usr/bin/env bash

# Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

set -euo pipefail

cd $(dirname $0)/../../..
source hack/lib.sh

REPOSITORY=quay.io/kubermatic/web-terminal
VERSION=0.8.0
SUFFIX=""
ARCHITECTURES="${ARCHITECTURES:-linux/amd64,linux/arm64/v8}"
IMAGE="${REPOSITORY}:${VERSION}${SUFFIX}"
MANIFEST=${MANIFEST:-${IMAGE}}

# build multi-arch images
#  start_docker_daemon_ci
docker buildx create --use

for ARCH in ${ARCHITECTURES}; do
  echodate "Building image for $ARCH..."

  docker buildx build ./hack/images/web-terminal \
    --platform "${ARCH}" \
    --build-arg "ARCH=${ARCH}" \
    --load \
    --tag "${REPOSITORY}:${VERSION}${SUFFIX}-${ARCH}"

  echodate "Successfully built image for $ARCH."

  docker push "${REPOSITORY}:${VERSION}${SUFFIX}-${ARCH}"

  echodate "Successfully pushed image for $ARCH."
done

echodate "Successfully built for all architectures."
docker manifest create --amend "${MANIFEST}" "${REPOSITORY}:${VERSION}${SUFFIX}-amd64" "${REPOSITORY}:${VERSION}${SUFFIX}-arm64"

for arch in $ARCHITECTURES; do
    docker manifest annotate --arch "${ARCH}" "${REPOSITORY}:${VERSION}${SUFFIX}" "${REPOSITORY}:${VERSION}${SUFFIX}-${ARCH}"
  done

docker manifest push --purge "${REPOSITORY}:${VERSION}${SUFFIX}"

echodate "Successfully pushed images for all architectures."
