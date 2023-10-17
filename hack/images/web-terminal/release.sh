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
VERSION=0.6.3
SUFFIX=""
ARCHITECTURES=${ARCHITECTURES:-amd64 arm64}
IMAGE="${REPOSITORY}:${VERSION}${SUFFIX}"
MANIFEST=${MANIFEST:-${IMAGE}}

# build multi-arch images
buildah manifest create ${MANIFEST}
for ARCH in ${ARCHITECTURES}; do
  echodate "Building image for $ARCH..."

  time buildah bud \
    --tag "${REPOSITORY}-${ARCH}:${VERSION}${SUFFIX}" \
    --build-arg "ARCH=${ARCH}" \
    --arch "$ARCH" \
    --override-arch "$ARCH" \
    --format=docker \
    --file hack/images/web-terminal/Dockerfile \
    .
  buildah manifest add $MANIFEST "${REPOSITORY}-${ARCH}:${VERSION}${SUFFIX}"

done
echodate "Successfully built for all architectures."

buildah manifest push --all ${MANIFEST} "docker://${IMAGE}"

echodate "Successfully pushed images for all architectures."
