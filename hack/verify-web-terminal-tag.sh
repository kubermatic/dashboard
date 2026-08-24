#!/usr/bin/env bash

# Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

# Changes under hack/images/web-terminal/ only reach users through a new image
# release, so any change there must come with an unpublished tag in
# metadata.yaml. The presubmit runs this script only when files in that
# directory change.

set -euo pipefail

cd $(dirname $0)/..
source hack/lib.sh

METADATA_FILE=hack/images/web-terminal/metadata.yaml
TAG="$(grep -E '^tag:' "$METADATA_FILE" | head -n1 | cut -d: -f2- | tr -d ' \t"')"

if [ -z "$TAG" ]; then
  echodate "No tag found in $METADATA_FILE"
  exit 1
fi

# quay's public API needs no credentials for public repositories
COUNT="$(retry 3 curl --fail --silent \
  "https://quay.io/api/v1/repository/kubermatic/web-terminal/tag/?specificTag=${TAG}&onlyActiveTags=true" |
  jq '.tags | length')"

if [ "$COUNT" != "0" ]; then
  echodate "Tag ${TAG} is already published at quay.io/kubermatic/web-terminal."
  echodate "Files under hack/images/web-terminal/ changed; bump tag in $METADATA_FILE to release them."
  exit 1
fi

echodate "Tag ${TAG} is not published yet; a merge will release it."
