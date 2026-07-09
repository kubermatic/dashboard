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
# read the tag from metadata.yaml so it has a single source of truth;
# the path is relative to the repo root because of the cd above
METADATA_FILE=hack/images/web-terminal/metadata.yaml
# take the value after the first "tag:" and strip whitespace and quotes
VERSION="$(grep -E '^tag:' "$METADATA_FILE" | head -n1 | cut -d: -f2- | tr -d ' \t"')"

if [ -z "$VERSION" ]; then
  echodate "No tag found in $METADATA_FILE"
  exit 1
fi

SUFFIX=""
ARCHITECTURES="${ARCHITECTURES:-linux/amd64,linux/arm64/v8}"
IMAGE="$REPOSITORY:$VERSION$SUFFIX"
MANIFEST="${MANIFEST:-$IMAGE}"

# skip if the tag already exists in the registry; makes the postsubmit
# idempotent so re-runs or re-merges of the same tag do not rebuild
# retry so a transient registry error is not read as "tag missing"
if retry 3 docker manifest inspect "$IMAGE" >/dev/null 2>&1; then
  echodate "Image $IMAGE already exists in the registry, skipping build."
  exit 0
fi

# build multi-arch images
#  start_docker_daemon_ci
docker buildx create --use

echodate "Building $IMAGE for $ARCHITECTURES…"
docker buildx build ./hack/images/web-terminal \
  --platform "$ARCHITECTURES" \
  --push \
  --tag "$IMAGE"

echodate "Successfully built and pushed image for all architectures."
